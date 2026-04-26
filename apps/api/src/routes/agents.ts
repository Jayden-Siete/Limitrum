import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { db, agents, policies, organizations, eq, and, sql, desc } from "@limitrum/db";
import { z } from "zod";

export const agentsRouter = new Hono<{ Variables: { organizationId: string } }>();

// ── Validation schemas ────────────────────────────────────────────────────────

const createAgentSchema = z.object({
  name: z.string().min(1).max(128),
  environment: z.enum(["development", "staging", "production"]).default("development"),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  status: z.enum(["active", "paused", "disabled"]).optional(),
  environment: z.enum(["development", "staging", "production"]).optional(),
});

// ── GET /v1/agents ────────────────────────────────────────────────────────────

agentsRouter.get("/", async (c) => {
  const organizationId = c.get("organizationId");

  // Pagination params
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 20), 1), 100);
  const offset = Math.max(Number(c.req.query("offset") ?? 0), 0);

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(agents)
    .where(eq(agents.organizationId, organizationId))
    .then((rows) => Number(rows[0]?.count ?? 0));

  // Get paginated results
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.organizationId, organizationId))
    .orderBy(desc(agents.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    agents: rows,
    total: totalResult,
    limit,
    offset,
    hasMore: offset + rows.length < totalResult,
  });
});

// ── POST /v1/agents ───────────────────────────────────────────────────────────

agentsRouter.post("/", async (c) => {
  const organizationId = c.get("organizationId");
  const body = await c.req.json().catch(() => null);
  const parsed = createAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid payload.", details: parsed.error.flatten() }, 400);
  }

  // Ensure the organization exists
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!org) {
    return c.json({ error: `Organization '${organizationId}' not found.` }, 404);
  }

  const now = Date.now();
  const agentId = `agent_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

  await db.insert(agents).values({
    id: agentId,
    organizationId,
    name: parsed.data.name,
    environment: parsed.data.environment,
    status: "active",
    createdAt: now,
  });

  const created = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1)
    .then((rows) => rows[0]);

  return c.json({ agent: created }, 201);
});

// ── GET /v1/agents/:id ────────────────────────────────────────────────────────

agentsRouter.get("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  return c.json({ agent });
});

// ── PATCH /v1/agents/:id ──────────────────────────────────────────────────────

agentsRouter.patch("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const existing = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid payload.", details: parsed.error.flatten() }, 400);
  }

  const updates: Partial<typeof existing> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.environment !== undefined) updates.environment = parsed.data.environment;

  if (Object.keys(updates).length > 0) {
    await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, agentId));
  }

  const updated = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1)
    .then((rows) => rows[0]);

  return c.json({ agent: updated });
});

// ── DELETE /v1/agents/:id ─────────────────────────────────────────────────────

agentsRouter.delete("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const existing = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  // Soft delete: set status to "disabled"
  await db
    .update(agents)
    .set({ status: "disabled" })
    .where(eq(agents.id, agentId));

  return c.json({ deleted: true, agentId });
});

// ── GET /v1/agents/:id/status ─────────────────────────────────────────────────

agentsRouter.get("/:id/status", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const policy = await db
    .select()
    .from(policies)
    .where(eq(policies.agentId, agentId))
    .limit(1)
    .then((rows) => rows[0]);

  return c.json({
    agentId,
    name: agent.name,
    status: agent.status,
    environment: agent.environment,
    hasPolicy: !!policy,
    policyId: policy?.id ?? null,
    maxDailySpend: policy?.maxDailySpend ?? null,
    guardsEnabled: policy
      ? {
          loopDetection: !!policy.loopDetectionEnabled,
          syscallProtection: !!policy.syscallProtectionEnabled,
          destructiveActions: !!policy.destructiveActionsEnabled,
          dataExfil: !!policy.dataExfilEnabled,
          promptInjection: !!policy.promptInjectionEnabled,
        }
      : null,
  });
});

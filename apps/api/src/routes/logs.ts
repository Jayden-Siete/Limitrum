import { Hono } from "hono";
import { db, intentLogs, agents, eq, and, gte, lte, desc, inArray, sql } from "@limitrum/db";
import { z } from "zod";

export const logsRouter = new Hono<{ Variables: { organizationId: string } }>();

// ── Validation schemas ────────────────────────────────────────────────────────

const logsQuerySchema = z.object({
  agentId: z.string().optional(),
  decision: z.enum(["allowed", "blocked"]).optional(),
  guardTriggered: z.string().optional(),
  from: z.coerce.number().optional(),   // Unix ms timestamp
  to: z.coerce.number().optional(),     // Unix ms timestamp
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// ── GET /v1/logs ──────────────────────────────────────────────────────────────

logsRouter.get("/", async (c) => {
  const organizationId = c.get("organizationId");
  const rawQuery = Object.fromEntries(new URL(c.req.url).searchParams.entries());
  const parsed = logsQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters.", details: parsed.error.flatten() }, 400);
  }

  const { agentId, decision, guardTriggered, from, to, limit, offset } = parsed.data;

  // Resolve all agent IDs that belong to this organization
  const orgAgents = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.organizationId, organizationId));

  const orgAgentIds = orgAgents.map((a) => a.id);

  if (orgAgentIds.length === 0) {
    return c.json({ logs: [], total: 0, limit, offset });
  }

  // If a specific agentId is requested, verify it belongs to this org
  if (agentId && !orgAgentIds.includes(agentId)) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  // Build WHERE conditions dynamically
  const conditions = [];

  if (agentId) {
    conditions.push(eq(intentLogs.agentId, agentId));
  } else {
    // Filter to only logs for this org's agents.
    conditions.push(inArray(intentLogs.agentId, orgAgentIds));
  }

  if (decision) {
    conditions.push(eq(intentLogs.decision, decision));
  }

  if (guardTriggered) {
    conditions.push(eq(intentLogs.guardTriggered, guardTriggered));
  }

  if (from !== undefined) {
    conditions.push(gte(intentLogs.createdAt, from));
  }

  if (to !== undefined) {
    conditions.push(lte(intentLogs.createdAt, to));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching rows
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(intentLogs)
    .where(whereClause)
    .then((rows) => Number(rows[0]?.count ?? 0));

  // Fetch paginated rows
  const rows = await db
    .select()
    .from(intentLogs)
    .where(whereClause)
    .orderBy(desc(intentLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    logs: rows,
    total: totalResult,
    limit,
    offset,
    hasMore: offset + rows.length < totalResult,
  });
});

// ── GET /v1/logs/:id ──────────────────────────────────────────────────────────

logsRouter.get("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const logId = c.req.param("id");

  const log = await db
    .select()
    .from(intentLogs)
    .where(eq(intentLogs.id, logId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!log) {
    return c.json({ error: `Log '${logId}' not found.` }, 404);
  }

  // Verify the log's agent belongs to this org
  const agent = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, log.agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!agent) {
    return c.json({ error: `Log '${logId}' not found.` }, 404);
  }

  return c.json({ log });
});

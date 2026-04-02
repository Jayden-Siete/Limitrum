import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { db, agents, policies, eq, and } from "@limitrum/db";
import { z } from "zod";

export const policyRouter = new Hono<{ Variables: { organizationId: string } }>();

// ── Validation schemas ────────────────────────────────────────────────────────

const upsertPolicySchema = z.object({
  maxDailySpend: z.number().nonnegative(),
  perActionCap: z.number().nonnegative().default(0),
  maxRatePerMinute: z.number().int().nonnegative().default(0),
  allowedEndpoints: z.array(z.string().min(1)).default([]),

  // Behavioral guards
  loopDetectionEnabled: z.boolean().default(true),
  loopDetectionMaxCount: z.number().int().positive().default(5),
  loopDetectionWindowSec: z.number().int().positive().default(10),

  syscallProtectionEnabled: z.boolean().default(true),
  destructiveActionsEnabled: z.boolean().default(true),
  dataExfilEnabled: z.boolean().default(true),
  promptInjectionEnabled: z.boolean().default(false),

  blockedPatterns: z.array(z.string()).default([]),
});

type PolicyPayload = z.infer<typeof upsertPolicySchema>;

function policyToResponse(policy: NonNullable<Awaited<ReturnType<typeof fetchPolicy>>>) {
  return {
    id: policy.id,
    agentId: policy.agentId,
    maxDailySpend: policy.maxDailySpend,
    perActionCap: policy.perActionCap,
    maxRatePerMinute: policy.maxRatePerMinute,
    allowedEndpoints: JSON.parse(policy.allowedEndpoints) as string[],
    guards: {
      loopDetection: {
        enabled: !!policy.loopDetectionEnabled,
        maxCount: policy.loopDetectionMaxCount,
        windowSec: policy.loopDetectionWindowSec,
      },
      syscallProtection: { enabled: !!policy.syscallProtectionEnabled },
      destructiveActions: { enabled: !!policy.destructiveActionsEnabled },
      dataExfil: { enabled: !!policy.dataExfilEnabled },
      promptInjection: { enabled: !!policy.promptInjectionEnabled },
    },
    blockedPatterns: JSON.parse(policy.blockedPatterns) as string[],
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

async function fetchPolicy(agentId: string) {
  return db
    .select()
    .from(policies)
    .where(eq(policies.agentId, agentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function assertAgentBelongsToOrg(agentId: string, organizationId: string) {
  return db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

// ── GET /v1/agents/:id/policy ─────────────────────────────────────────────────

policyRouter.get("/:id/policy", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await assertAgentBelongsToOrg(agentId, organizationId);
  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const policy = await fetchPolicy(agentId);
  if (!policy) {
    return c.json({ error: `No policy found for agent '${agentId}'.` }, 404);
  }

  return c.json({ policy: policyToResponse(policy) });
});

// ── PUT /v1/agents/:id/policy ─────────────────────────────────────────────────
// Full upsert — creates or replaces the policy for an agent.

policyRouter.put("/:id/policy", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await assertAgentBelongsToOrg(agentId, organizationId);
  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = upsertPolicySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload.", details: parsed.error.flatten() }, 400);
  }

  const data: PolicyPayload = parsed.data;
  const now = Date.now();
  const existing = await fetchPolicy(agentId);

  const policyValues = {
    agentId,
    maxDailySpend: data.maxDailySpend,
    perActionCap: data.perActionCap,
    maxRatePerMinute: data.maxRatePerMinute,
    allowedEndpoints: JSON.stringify(data.allowedEndpoints),
    loopDetectionEnabled: data.loopDetectionEnabled ? 1 : 0,
    loopDetectionMaxCount: data.loopDetectionMaxCount,
    loopDetectionWindowSec: data.loopDetectionWindowSec,
    syscallProtectionEnabled: data.syscallProtectionEnabled ? 1 : 0,
    destructiveActionsEnabled: data.destructiveActionsEnabled ? 1 : 0,
    dataExfilEnabled: data.dataExfilEnabled ? 1 : 0,
    promptInjectionEnabled: data.promptInjectionEnabled ? 1 : 0,
    blockedPatterns: JSON.stringify(data.blockedPatterns),
    updatedAt: now,
  };

  if (existing) {
    await db
      .update(policies)
      .set(policyValues)
      .where(eq(policies.id, existing.id));
  } else {
    await db.insert(policies).values({
      id: `policy_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      ...policyValues,
      createdAt: now,
    });
  }

  const updated = await fetchPolicy(agentId);
  return c.json({ policy: policyToResponse(updated!) }, existing ? 200 : 201);
});

// ── PATCH /v1/agents/:id/policy ───────────────────────────────────────────────
// Partial update — only updates the fields provided.

policyRouter.patch("/:id/policy", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await assertAgentBelongsToOrg(agentId, organizationId);
  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const existing = await fetchPolicy(agentId);
  if (!existing) {
    return c.json({ error: `No policy found for agent '${agentId}'. Use PUT to create one.` }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = upsertPolicySchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.maxDailySpend !== undefined) updates.maxDailySpend = data.maxDailySpend;
  if (data.perActionCap !== undefined) updates.perActionCap = data.perActionCap;
  if (data.maxRatePerMinute !== undefined) updates.maxRatePerMinute = data.maxRatePerMinute;
  if (data.allowedEndpoints !== undefined) updates.allowedEndpoints = JSON.stringify(data.allowedEndpoints);
  if (data.loopDetectionEnabled !== undefined) updates.loopDetectionEnabled = data.loopDetectionEnabled ? 1 : 0;
  if (data.loopDetectionMaxCount !== undefined) updates.loopDetectionMaxCount = data.loopDetectionMaxCount;
  if (data.loopDetectionWindowSec !== undefined) updates.loopDetectionWindowSec = data.loopDetectionWindowSec;
  if (data.syscallProtectionEnabled !== undefined) updates.syscallProtectionEnabled = data.syscallProtectionEnabled ? 1 : 0;
  if (data.destructiveActionsEnabled !== undefined) updates.destructiveActionsEnabled = data.destructiveActionsEnabled ? 1 : 0;
  if (data.dataExfilEnabled !== undefined) updates.dataExfilEnabled = data.dataExfilEnabled ? 1 : 0;
  if (data.promptInjectionEnabled !== undefined) updates.promptInjectionEnabled = data.promptInjectionEnabled ? 1 : 0;
  if (data.blockedPatterns !== undefined) updates.blockedPatterns = JSON.stringify(data.blockedPatterns);

  await db
    .update(policies)
    .set(updates)
    .where(eq(policies.id, existing.id));

  const updated = await fetchPolicy(agentId);
  return c.json({ policy: policyToResponse(updated!) });
});

// ── DELETE /v1/agents/:id/policy ──────────────────────────────────────────────

policyRouter.delete("/:id/policy", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("id");

  const agent = await assertAgentBelongsToOrg(agentId, organizationId);
  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const existing = await fetchPolicy(agentId);
  if (!existing) {
    return c.json({ error: `No policy found for agent '${agentId}'.` }, 404);
  }

  await db.delete(policies).where(eq(policies.id, existing.id));

  return c.json({ deleted: true, policyId: existing.id });
});

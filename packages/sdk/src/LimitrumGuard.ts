import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@limitrum/db";
import { intentLogs, policies } from "@limitrum/db";
import { z } from "zod";

const verifyIntentInputSchema = z.object({
  agentId: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  estimatedCostUsd: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type VerifyIntentInput = z.input<typeof verifyIntentInputSchema>;

export type VerifyIntentResult = {
  allowed: boolean;
  decision: "allowed" | "blocked";
  reason: string;
  policyId?: string;
};

function normalizeTargetHost(target: string) {
  try {
    const withProtocol = target.includes("://") ? target : `https://${target}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return target.toLowerCase().split("/")[0];
  }
}

function parseAllowlist(raw: string) {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [] as string[];
  }
  return parsed
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.toLowerCase());
}

export class LimitrumGuard {
  async verify(input: VerifyIntentInput): Promise<VerifyIntentResult> {
    const intent = verifyIntentInputSchema.parse(input);

    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.agentId, intent.agentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!policy) {
      const reason = `No policy found for agent '${intent.agentId}'.`;
      await db.insert(intentLogs).values({
        id: randomUUID(),
        agentId: intent.agentId,
        policyId: null,
        action: intent.action,
        target: intent.target,
        decision: "blocked",
        reason,
        amount: intent.amount ?? intent.estimatedCostUsd ?? 0,
        estimatedCostUsd: intent.estimatedCostUsd ?? intent.amount ?? 0,
        createdAt: Date.now(),
      });
      return {
        allowed: false,
        decision: "blocked",
        reason,
      };
    }

    const targetHost = normalizeTargetHost(intent.target);
    const allowedEndpoints = parseAllowlist(policy.allowedEndpoints);
    const amount = intent.amount ?? intent.estimatedCostUsd ?? 0;

    let decision: "allowed" | "blocked" = "allowed";
    let reason = "Intent accepted by deterministic policy kernel.";

    if (!allowedEndpoints.includes(targetHost)) {
      decision = "blocked";
      reason = `Domain '${targetHost}' is not allowlisted.`;
    } else if (amount > policy.maxDailySpend) {
      decision = "blocked";
      reason = `Amount $${amount.toFixed(2)} exceeds max_daily_spend $${policy.maxDailySpend.toFixed(2)}.`;
    }

    await db.insert(intentLogs).values({
      id: randomUUID(),
      agentId: intent.agentId,
      policyId: policy.id,
      action: intent.action,
      target: intent.target,
      decision,
      reason,
      amount,
      estimatedCostUsd: intent.estimatedCostUsd ?? amount,
      createdAt: Date.now(),
    });

    return {
      allowed: decision === "allowed",
      decision,
      reason,
      policyId: policy.id,
    };
  }
}

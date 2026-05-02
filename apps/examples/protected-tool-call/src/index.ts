import { randomUUID } from "node:crypto";
import { LimitrumGuard, type VerifyIntentInput, type VerifyIntentResult } from "@limitrum/sdk";
import { agents, bootstrapSchema, db, eq, organizations, policies } from "@limitrum/db";

const organizationId = "org_limitrum_examples";
const agentId = `agent_demo_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

function formatVerdict(label: string, verdict: VerifyIntentResult) {
  const status = verdict.allowed ? "ALLOW" : "BLOCK";
  const guard = verdict.guardTriggered ? ` guard=${verdict.guardTriggered}` : "";
  return `${status.padEnd(5)} ${label.padEnd(34)} reason="${verdict.reason}"${guard}`;
}

async function preparePolicy() {
  const now = Date.now();

  await bootstrapSchema();

  await db
    .insert(organizations)
    .values({
      id: organizationId,
      name: "Limitrum Examples",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db.insert(agents).values({
    id: agentId,
    organizationId,
    name: "Protected Tool Demo Agent",
    environment: "development",
    status: "active",
    createdAt: now,
  });

  await db.insert(policies).values({
    id: `policy_${agentId}`,
    agentId,
    maxDailySpend: 500,
    perActionCap: 100,
    maxRatePerMinute: 60,
    allowedEndpoints: JSON.stringify(["api.stripe.com", "api.github.com"]),
    loopDetectionEnabled: 1,
    loopDetectionMaxCount: 5,
    loopDetectionWindowSec: 10,
    syscallProtectionEnabled: 1,
    destructiveActionsEnabled: 1,
    dataExfilEnabled: 1,
    promptInjectionEnabled: 1,
    blockedPatterns: "[]",
    createdAt: now,
    updatedAt: now,
  });
}

async function runProtectedTool(label: string, intent: VerifyIntentInput) {
  const guard = new LimitrumGuard();
  const verdict = await guard.verify(intent);

  console.log(formatVerdict(label, verdict));

  if (!verdict.allowed) {
    return verdict;
  }

  // This is where a real app would call Stripe, GitHub, a database, or another tool.
  console.log(`      executed mocked tool target=${intent.target} amount=$${intent.amount ?? 0}`);
  return verdict;
}

async function main() {
  await preparePolicy();

  console.log("Limitrum protected tool-call example");
  console.log(`agent=${agentId}`);
  console.log("policy=allow api.stripe.com/api.github.com, perActionCap=$100, dailyBudget=$500\n");

  await runProtectedTool("stripe.createCharge $25", {
    agentId,
    action: "stripe.createCharge",
    target: "api.stripe.com/v1/charges",
    amount: 25,
    estimatedCostUsd: 25,
    metadata: {
      source: "example.protected-tool-call",
      customerId: "cus_demo_safe",
    },
  });

  await runProtectedTool("stripe.createCharge $250", {
    agentId,
    action: "stripe.createCharge",
    target: "api.stripe.com/v1/charges",
    amount: 250,
    estimatedCostUsd: 250,
    metadata: {
      source: "example.protected-tool-call",
      customerId: "cus_demo_high_risk",
    },
  });

  await runProtectedTool("fetch unknown domain", {
    agentId,
    action: "fetch",
    target: "api.unknown-exfil.io/private-export",
    amount: 1,
    estimatedCostUsd: 1,
    metadata: {
      source: "example.protected-tool-call",
      purpose: "data export",
    },
  });
}

main().catch((error) => {
  console.error("Protected tool-call example failed:", error);
  process.exit(1);
});

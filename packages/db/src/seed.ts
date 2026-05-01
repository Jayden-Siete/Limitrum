import { and, eq } from "drizzle-orm";
import { db } from "./client.js";
import { bootstrapSchema } from "./migrate.js";
import { agents, organizations, policies } from "./schema.js";

async function seed() {
  await bootstrapSchema();
  const now = Date.now();

  const organizationId = "org_limitrum_demo";
  const agentId = "agent_sales_01";
  const policyId = "policy_sales_01_strict";

  await db
    .insert(organizations)
    .values({
      id: organizationId,
      name: "Limitrum Demo Org",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(agents)
    .values({
      id: agentId,
      organizationId,
      name: "Billing Agent",
      environment: "development",
      status: "active",
      createdAt: now,
    })
    .onConflictDoNothing();

  const existingPolicy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.id, policyId), eq(policies.agentId, agentId)))
    .limit(1);

  const strictAllowlist = JSON.stringify(["api.stripe.com", "api.openai.com", "api.github.com"]);

  if (existingPolicy.length === 0) {
    await db.insert(policies).values({
      id: policyId,
      agentId,
      maxDailySpend: 50,
      perActionCap: 100,
      maxRatePerMinute: 60,
      allowedEndpoints: strictAllowlist,
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
  } else {
    await db
      .update(policies)
      .set({
        maxDailySpend: 50,
        perActionCap: 100,
        maxRatePerMinute: 60,
        allowedEndpoints: strictAllowlist,
        loopDetectionEnabled: 1,
        loopDetectionMaxCount: 5,
        loopDetectionWindowSec: 10,
        syscallProtectionEnabled: 1,
        destructiveActionsEnabled: 1,
        dataExfilEnabled: 1,
        promptInjectionEnabled: 1,
        updatedAt: now,
      })
      .where(eq(policies.id, policyId));
  }

  console.log("\nSeed complete:", { organizationId, agentId, policyId });
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

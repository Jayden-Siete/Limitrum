import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./client.js";
import { bootstrapSchema } from "./migrate.js";
import { agents, apiKeys, organizations, policies } from "./schema.js";

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

  // Seed a demo API key (only if not already present)
  const demoKeyId = "apikey_demo_01";
  const existingKey = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, demoKeyId))
    .limit(1);

  if (existingKey.length === 0) {
    const rawKey = `lmt_demo_${randomBytes(16).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    await db.insert(apiKeys).values({
      id: demoKeyId,
      organizationId,
      keyHash,
      label: "Demo API Key",
      expiresAt: null,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: now,
    });
    console.log("\n⚠️  Demo API Key (save this — shown only once):", rawKey);
  }

  console.log("\n✅ Seed complete:", { organizationId, agentId, policyId });
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

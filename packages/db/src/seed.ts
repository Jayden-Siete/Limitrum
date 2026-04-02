import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, sqlite } from "./client.js";
import { agents, apiKeys, organizations, policies } from "./schema.js";

export function bootstrapSchema() {
  const ddl = [
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY NOT NULL,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'development',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )`,
    `CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY NOT NULL,
      agent_id TEXT NOT NULL,
      max_daily_spend REAL NOT NULL,
      per_action_cap REAL NOT NULL DEFAULT 0,
      max_rate_per_minute INTEGER NOT NULL DEFAULT 0,
      allowed_endpoints TEXT NOT NULL,
      loop_detection_enabled INTEGER NOT NULL DEFAULT 1,
      loop_detection_max_count INTEGER NOT NULL DEFAULT 5,
      loop_detection_window_sec INTEGER NOT NULL DEFAULT 10,
      syscall_protection_enabled INTEGER NOT NULL DEFAULT 1,
      destructive_actions_enabled INTEGER NOT NULL DEFAULT 1,
      data_exfil_enabled INTEGER NOT NULL DEFAULT 1,
      prompt_injection_enabled INTEGER NOT NULL DEFAULT 0,
      blocked_patterns TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,
    `CREATE TABLE IF NOT EXISTS intent_logs (
      id TEXT PRIMARY KEY NOT NULL,
      agent_id TEXT NOT NULL,
      policy_id TEXT,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT NOT NULL,
      guard_triggered TEXT,
      amount REAL NOT NULL DEFAULT 0,
      estimated_cost_usd REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    )`,
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY NOT NULL,
      organization_id TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )`,
    // Indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_intent_logs_agent_created
      ON intent_logs(agent_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_intent_logs_agent_decision
      ON intent_logs(agent_id, decision, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_policies_agent
      ON policies(agent_id)`,
  ];
  return Promise.all(ddl.map((statement) => sqlite.execute(statement)));
}

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

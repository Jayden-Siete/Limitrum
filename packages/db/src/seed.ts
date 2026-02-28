import { and, eq } from "drizzle-orm";
import { db, sqlite } from "./client.js";
import { agents, organizations, policies } from "./schema.js";

function bootstrapSchema() {
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
      allowed_endpoints TEXT NOT NULL,
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
      amount REAL NOT NULL DEFAULT 0,
      estimated_cost_usd REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    )`,
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
      allowedEndpoints: strictAllowlist,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(policies)
      .set({
        maxDailySpend: 50,
        allowedEndpoints: strictAllowlist,
        updatedAt: now,
      })
      .where(eq(policies.id, policyId));
  }

  console.log("Seed complete:", { organizationId, agentId, policyId });
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

import { fileURLToPath } from "node:url";
import { sqlite } from "./client.js";

const MIGRATION_VERSION = "0001_initial_schema";

export async function bootstrapSchema() {
  const ddl = [
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )`,
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
    `CREATE INDEX IF NOT EXISTS idx_intent_logs_agent_created
      ON intent_logs(agent_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_intent_logs_agent_decision
      ON intent_logs(agent_id, decision, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_policies_agent
      ON policies(agent_id)`,
    `INSERT OR IGNORE INTO schema_migrations (version, applied_at)
      VALUES ('${MIGRATION_VERSION}', ${Date.now()})`,
  ];

  for (const statement of ddl) {
    await sqlite.execute(statement);
  }
}

async function migrate() {
  await bootstrapSchema();
  console.log("Database migrations applied:", { version: MIGRATION_VERSION });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  migrate().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

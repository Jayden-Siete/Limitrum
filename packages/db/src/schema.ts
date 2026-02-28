import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  environment: text("environment").notNull().default("development"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const policies = sqliteTable("policies", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  maxDailySpend: real("max_daily_spend").notNull(),
  allowedEndpoints: text("allowed_endpoints").notNull(), // JSON string array
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const intentLogs = sqliteTable("intent_logs", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  policyId: text("policy_id")
    .notNull()
    .references(() => policies.id),
  action: text("action").notNull(),
  target: text("target").notNull(),
  decision: text("decision").notNull(), // allowed | blocked
  reason: text("reason").notNull(),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

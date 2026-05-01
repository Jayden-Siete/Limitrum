import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  environment: text("environment").notNull().default("development"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull(),
});

export const policies = sqliteTable("policies", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),

  // -- Financial controls ------------------------------------------
  /** Maximum cumulative spend allowed per UTC day (USD) */
  maxDailySpend: real("max_daily_spend").notNull(),
  /** Maximum cost allowed for a single action (USD). 0 = unlimited */
  perActionCap: real("per_action_cap").notNull().default(0),

  // -- Rate limiting -----------------------------------------------
  /** Maximum number of allowed actions per minute. 0 = unlimited */
  maxRatePerMinute: integer("max_rate_per_minute").notNull().default(0),

  // -- Domain allowlist --------------------------------------------
  /** JSON string array of allowed hostnames e.g. ["api.stripe.com"] */
  allowedEndpoints: text("allowed_endpoints").notNull(),

  // -- Behavioral guards (1 = enabled, 0 = disabled) ---------------
  /** Detect repeated identical actions within a short window */
  loopDetectionEnabled: integer("loop_detection_enabled").notNull().default(1),
  /** Maximum identical actions allowed in the loop window. Default: 5 */
  loopDetectionMaxCount: integer("loop_detection_max_count").notNull().default(5),
  /** Loop detection window in seconds. Default: 10 */
  loopDetectionWindowSec: integer("loop_detection_window_sec").notNull().default(10),

  /** Block syscall / process-spawn targets */
  syscallProtectionEnabled: integer("syscall_protection_enabled").notNull().default(1),

  /** Block destructive SQL / filesystem actions */
  destructiveActionsEnabled: integer("destructive_actions_enabled").notNull().default(1),

  /** Block requests to non-allowlisted external domains (data exfiltration) */
  dataExfilEnabled: integer("data_exfil_enabled").notNull().default(1),

  /** Detect prompt injection patterns in action metadata */
  promptInjectionEnabled: integer("prompt_injection_enabled").notNull().default(0),

  /** JSON array of additional blocked regex patterns applied to action + target */
  blockedPatterns: text("blocked_patterns").notNull().default("[]"),

  // -- Timestamps --------------------------------------------------
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const intentLogs = sqliteTable("intent_logs", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  policyId: text("policy_id").references(() => policies.id),
  action: text("action").notNull(),
  target: text("target").notNull(),
  decision: text("decision").notNull(), // allowed | blocked
  reason: text("reason").notNull(),
  /** Guard that triggered the block (e.g. "budget", "domain", "loop", "syscall") */
  guardTriggered: text("guard_triggered"),
  amount: real("amount").notNull().default(0),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

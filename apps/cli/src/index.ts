#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { Command } from "commander";
import { LimitrumGuard } from "@limitrum/sdk";
import {
  agents,
  db,
  intentLogs,
  organizations,
  policies,
  eq,
  desc,
  and,
  gte,
  sql,
} from "@limitrum/db";

// ── Program setup ─────────────────────────────────────────────────────────────

const program = new Command();
const guard = new LimitrumGuard();

program
  .name("limitrum")
  .description("Limitrum CLI — deterministic safety for autonomous agents")
  .version("0.1.0");

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(label: string, value: string | number | boolean | null | undefined, width = 22) {
  const padded = String(label).padEnd(width);
  return `  ${padded} ${value ?? "—"}`;
}

function fmtDecision(decision: string) {
  return decision === "allowed" ? "✅ ALLOWED" : "🚫 BLOCKED";
}

function fmtBudgetBar(spent: number, max: number, width = 30) {
  if (max <= 0) return "[no budget set]";
  const pct = Math.min(1, spent / max);
  const filled = Math.round(pct * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `[${bar}] ${(pct * 100).toFixed(1)}%`;
}

function getStartOfUtcDayMs(nowMs: number) {
  const d = new Date(nowMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

// ── simulate command ──────────────────────────────────────────────────────────

program
  .command("simulate")
  .description("Run a YOLO-agent cumulative budget simulation locally (zero cost)")
  .option("--agent-id <agentId>", "Agent identifier to use")
  .option("--requests <n>", "Number of requests to simulate", "12")
  .option("--amount <usd>", "Cost per request in USD", "5")
  .option("--target <url>", "Target endpoint", "api.openai.com/v1/chat/completions")
  .action(async (opts) => {
    const agentId =
      (opts.agentId as string | undefined) ?? `agent_yolo_${randomUUID().slice(0, 8)}`;
    const requests = Number(opts.requests);
    const amount = Number(opts.amount);
    const target = opts.target as string;

    await ensureYoloAgent(agentId, amount * requests);

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Limitrum YOLO Simulation`);
    console.log(`${"─".repeat(60)}`);
    console.log(fmt("Agent ID:", agentId));
    console.log(fmt("Budget:", `$${(amount * requests).toFixed(2)}`));
    console.log(fmt("Requests:", `${requests} × $${amount.toFixed(2)}`));
    console.log(fmt("Target:", target));
    console.log(`${"─".repeat(60)}\n`);

    let allowed = 0;
    let blocked = 0;

    for (let i = 1; i <= requests; i++) {
      const startedAt = performance.now();
      const result = await guard.verify({
        agentId,
        action: "openai.chat.completions.create",
        target,
        amount,
        estimatedCostUsd: amount,
        metadata: { source: "cli.simulate", mode: "yolo", iteration: i },
      });
      const latencyMs = Math.max(0.01, performance.now() - startedAt);

      if (result.allowed) allowed++;
      else blocked++;

      const guard_ = result.guardTriggered ? ` [${result.guardTriggered}]` : "";
      console.log(
        `  #${String(i).padStart(2, "0")} ${fmtDecision(result.decision)}${guard_}` +
          ` | $${amount.toFixed(2)} | ${latencyMs.toFixed(2)}ms | ${result.reason}`,
      );
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Results: ${allowed} allowed, ${blocked} blocked`);
    console.log(`${"─".repeat(60)}\n`);
  });

// ── agent commands ────────────────────────────────────────────────────────────

const agentCmd = program.command("agent").description("Manage agents");

agentCmd
  .command("list")
  .description("List all agents in the local database")
  .option("--org <orgId>", "Filter by organization ID")
  .action(async (opts) => {
    const orgId = opts.org as string | undefined;

    const rows = orgId
      ? await db.select().from(agents).where(eq(agents.organizationId, orgId)).orderBy(agents.createdAt)
      : await db.select().from(agents).orderBy(agents.createdAt);

    if (rows.length === 0) {
      console.log("\n  No agents found. Run `pnpm --filter @limitrum/db seed` to seed demo data.\n");
      return;
    }

    console.log(`\n${"─".repeat(70)}`);
    console.log(`  Agents (${rows.length})`);
    console.log(`${"─".repeat(70)}`);
    for (const agent of rows) {
      console.log(fmt("ID:", agent.id));
      console.log(fmt("Name:", agent.name));
      console.log(fmt("Org:", agent.organizationId));
      console.log(fmt("Environment:", agent.environment));
      console.log(fmt("Status:", agent.status));
      console.log(fmt("Created:", new Date(agent.createdAt).toISOString()));
      console.log(`  ${"·".repeat(66)}`);
    }
    console.log();
  });

agentCmd
  .command("status <agentId>")
  .description("Show status and policy summary for an agent")
  .action(async (agentId: string) => {
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!agent) {
      console.error(`\n  ❌ Agent '${agentId}' not found.\n`);
      process.exit(1);
    }

    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.agentId, agentId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const now = Date.now();
    const startOfDay = getStartOfUtcDayMs(now);

    const [daySpend, totalActions, blockedToday] = await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
        .from(intentLogs)
        .where(
          and(
            eq(intentLogs.agentId, agentId),
            eq(intentLogs.decision, "allowed"),
            gte(intentLogs.createdAt, startOfDay),
          ),
        )
        .then((rows) => Number(rows[0]?.total ?? 0)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(eq(intentLogs.agentId, agentId))
        .then((rows) => Number(rows[0]?.count ?? 0)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(
          and(
            eq(intentLogs.agentId, agentId),
            eq(intentLogs.decision, "blocked"),
            gte(intentLogs.createdAt, startOfDay),
          ),
        )
        .then((rows) => Number(rows[0]?.count ?? 0)),
    ]);

    const maxDailySpend = policy?.maxDailySpend ?? 0;
    const remaining = Math.max(0, maxDailySpend - daySpend);

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Agent Status: ${agent.name}`);
    console.log(`${"─".repeat(60)}`);
    console.log(fmt("Agent ID:", agent.id));
    console.log(fmt("Status:", agent.status === "active" ? "🟢 active" : `🔴 ${agent.status}`));
    console.log(fmt("Environment:", agent.environment));
    console.log(fmt("Organization:", agent.organizationId));
    console.log(fmt("Total actions:", totalActions));
    console.log(fmt("Blocked today:", blockedToday));

    if (policy) {
      console.log(`\n  Policy`);
      console.log(fmt("  Policy ID:", policy.id));
      console.log(fmt("  Max daily spend:", `$${policy.maxDailySpend.toFixed(2)}`));
      console.log(fmt("  Per-action cap:", policy.perActionCap > 0 ? `$${policy.perActionCap.toFixed(2)}` : "none"));
      console.log(fmt("  Rate limit:", policy.maxRatePerMinute > 0 ? `${policy.maxRatePerMinute}/min` : "none"));
      console.log(`\n  Budget Today`);
      console.log(fmt("  Spent:", `$${daySpend.toFixed(2)}`));
      console.log(fmt("  Remaining:", `$${remaining.toFixed(2)}`));
      console.log(`  ${fmtBudgetBar(daySpend, maxDailySpend)}`);
      console.log(`\n  Guards`);
      console.log(fmt("  Loop detection:", policy.loopDetectionEnabled ? "✅ on" : "⬜ off"));
      console.log(fmt("  Syscall protection:", policy.syscallProtectionEnabled ? "✅ on" : "⬜ off"));
      console.log(fmt("  Destructive actions:", policy.destructiveActionsEnabled ? "✅ on" : "⬜ off"));
      console.log(fmt("  Data exfil:", policy.dataExfilEnabled ? "✅ on" : "⬜ off"));
      console.log(fmt("  Prompt injection:", policy.promptInjectionEnabled ? "✅ on" : "⬜ off"));
    } else {
      console.log("\n  ⚠️  No policy configured for this agent.");
    }
    console.log();
  });

// ── policy commands ───────────────────────────────────────────────────────────

const policyCmd = program.command("policy").description("Manage agent policies");

policyCmd
  .command("show <agentId>")
  .description("Show the policy for an agent")
  .action(async (agentId: string) => {
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.agentId, agentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!policy) {
      console.error(`\n  ❌ No policy found for agent '${agentId}'.\n`);
      process.exit(1);
    }

    const allowedEndpoints = JSON.parse(policy.allowedEndpoints) as string[];
    const blockedPatterns = JSON.parse(policy.blockedPatterns) as string[];

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Policy: ${policy.id}`);
    console.log(`${"─".repeat(60)}`);
    console.log(fmt("Agent ID:", policy.agentId));
    console.log(fmt("Max daily spend:", `$${policy.maxDailySpend.toFixed(2)}`));
    console.log(fmt("Per-action cap:", policy.perActionCap > 0 ? `$${policy.perActionCap.toFixed(2)}` : "none"));
    console.log(fmt("Rate limit:", policy.maxRatePerMinute > 0 ? `${policy.maxRatePerMinute}/min` : "none"));
    console.log(fmt("Allowed endpoints:", allowedEndpoints.length > 0 ? allowedEndpoints.join(", ") : "none (open)"));
    console.log(fmt("Blocked patterns:", blockedPatterns.length > 0 ? blockedPatterns.join(", ") : "none"));
    console.log(`\n  Guards`);
    console.log(fmt("  Loop detection:", `${policy.loopDetectionEnabled ? "✅ on" : "⬜ off"} (max ${policy.loopDetectionMaxCount} in ${policy.loopDetectionWindowSec}s)`));
    console.log(fmt("  Syscall protection:", policy.syscallProtectionEnabled ? "✅ on" : "⬜ off"));
    console.log(fmt("  Destructive actions:", policy.destructiveActionsEnabled ? "✅ on" : "⬜ off"));
    console.log(fmt("  Data exfil:", policy.dataExfilEnabled ? "✅ on" : "⬜ off"));
    console.log(fmt("  Prompt injection:", policy.promptInjectionEnabled ? "✅ on" : "⬜ off"));
    console.log(fmt("Updated:", new Date(policy.updatedAt).toISOString()));
    console.log();
  });

policyCmd
  .command("apply <agentId>")
  .description("Create or update a policy for an agent (interactive)")
  .option("--max-daily-spend <usd>", "Maximum daily spend in USD", "50")
  .option("--per-action-cap <usd>", "Per-action cost cap in USD (0 = disabled)", "0")
  .option("--rate-limit <rpm>", "Max actions per minute (0 = disabled)", "0")
  .option("--allowlist <domains>", "Comma-separated list of allowed domains", "")
  .option("--no-loop-detection", "Disable loop detection guard")
  .option("--no-syscall-protection", "Disable syscall protection guard")
  .option("--no-destructive-guard", "Disable destructive action guard")
  .option("--no-data-exfil", "Disable data exfiltration guard")
  .option("--prompt-injection", "Enable prompt injection shield")
  .action(async (agentId: string, opts) => {
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!agent) {
      console.error(`\n  ❌ Agent '${agentId}' not found.\n`);
      process.exit(1);
    }

    const now = Date.now();
    const maxDailySpend = Number(opts.maxDailySpend);
    const perActionCap = Number(opts.perActionCap);
    const maxRatePerMinute = Number(opts.rateLimit);
    const allowedEndpoints = (opts.allowlist as string)
      ? (opts.allowlist as string).split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const existing = await db
      .select()
      .from(policies)
      .where(eq(policies.agentId, agentId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const policyValues = {
      agentId,
      maxDailySpend,
      perActionCap,
      maxRatePerMinute,
      allowedEndpoints: JSON.stringify(allowedEndpoints),
      loopDetectionEnabled: opts.loopDetection !== false ? 1 : 0,
      loopDetectionMaxCount: 5,
      loopDetectionWindowSec: 10,
      syscallProtectionEnabled: opts.syscallProtection !== false ? 1 : 0,
      destructiveActionsEnabled: opts.destructiveGuard !== false ? 1 : 0,
      dataExfilEnabled: opts.dataExfil !== false ? 1 : 0,
      promptInjectionEnabled: opts.promptInjection ? 1 : 0,
      blockedPatterns: "[]",
      updatedAt: now,
    };

    if (existing) {
      await db.update(policies).set(policyValues).where(eq(policies.id, existing.id));
      console.log(`\n  ✅ Policy updated for agent '${agentId}'.\n`);
    } else {
      await db.insert(policies).values({
        id: `policy_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
        ...policyValues,
        createdAt: now,
      });
      console.log(`\n  ✅ Policy created for agent '${agentId}'.\n`);
    }
  });

// ── logs commands ─────────────────────────────────────────────────────────────

const logsCmd = program.command("logs").description("View intent audit logs");

logsCmd
  .command("tail [agentId]")
  .description("Show the most recent intent logs")
  .option("-n, --lines <n>", "Number of lines to show", "20")
  .option("--decision <d>", "Filter by decision: allowed | blocked")
  .option("--guard <name>", "Filter by guard triggered")
  .action(async (agentId: string | undefined, opts) => {
    const limit = Number(opts.lines);
    const decision = opts.decision as string | undefined;
    const guardFilter = opts.guard as string | undefined;

    const conditions = [];
    if (agentId) conditions.push(eq(intentLogs.agentId, agentId));
    if (decision) conditions.push(eq(intentLogs.decision, decision));
    if (guardFilter) conditions.push(eq(intentLogs.guardTriggered, guardFilter));

    const rows = await db
      .select()
      .from(intentLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(intentLogs.createdAt))
      .limit(limit);

    if (rows.length === 0) {
      console.log("\n  No logs found.\n");
      return;
    }

    console.log(`\n${"─".repeat(80)}`);
    console.log(`  Intent Logs (last ${rows.length})`);
    console.log(`${"─".repeat(80)}`);

    for (const log of rows) {
      const ts = new Date(log.createdAt).toISOString();
      const guard_ = log.guardTriggered ? ` [${log.guardTriggered}]` : "";
      console.log(
        `  ${ts}  ${fmtDecision(log.decision)}${guard_}`,
      );
      console.log(`    Agent: ${log.agentId} | Action: ${log.action}`);
      console.log(`    Target: ${log.target} | Amount: $${log.amount.toFixed(2)}`);
      console.log(`    Reason: ${log.reason}`);
      console.log();
    }
  });

logsCmd
  .command("stats [agentId]")
  .description("Show aggregate statistics for intent logs")
  .action(async (agentId: string | undefined) => {
    const now = Date.now();
    const startOfDay = getStartOfUtcDayMs(now);

    const baseCondition = agentId ? eq(intentLogs.agentId, agentId) : undefined;

    const [total, allowedCount, blockedCount, todayCount, topGuards] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(baseCondition)
        .then((rows) => Number(rows[0]?.count ?? 0)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(baseCondition ? and(baseCondition, eq(intentLogs.decision, "allowed")) : eq(intentLogs.decision, "allowed"))
        .then((rows) => Number(rows[0]?.count ?? 0)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(baseCondition ? and(baseCondition, eq(intentLogs.decision, "blocked")) : eq(intentLogs.decision, "blocked"))
        .then((rows) => Number(rows[0]?.count ?? 0)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(intentLogs)
        .where(
          baseCondition
            ? and(baseCondition, gte(intentLogs.createdAt, startOfDay))
            : gte(intentLogs.createdAt, startOfDay),
        )
        .then((rows) => Number(rows[0]?.count ?? 0)),

      db
        .select({
          guard: intentLogs.guardTriggered,
          count: sql<number>`count(*)`,
        })
        .from(intentLogs)
        .where(
          baseCondition
            ? and(baseCondition, eq(intentLogs.decision, "blocked"))
            : eq(intentLogs.decision, "blocked"),
        )
        .groupBy(intentLogs.guardTriggered)
        .orderBy(desc(sql`count(*)`))
        .limit(5),
    ]);

    const blockRate = total > 0 ? ((blockedCount / total) * 100).toFixed(1) : "0.0";

    console.log(`\n${"─".repeat(50)}`);
    console.log(`  Log Statistics${agentId ? ` — ${agentId}` : " — All Agents"}`);
    console.log(`${"─".repeat(50)}`);
    console.log(fmt("Total intents:", total));
    console.log(fmt("Allowed:", allowedCount));
    console.log(fmt("Blocked:", blockedCount));
    console.log(fmt("Block rate:", `${blockRate}%`));
    console.log(fmt("Today:", todayCount));

    if (topGuards.length > 0) {
      console.log(`\n  Top Guards Triggered`);
      for (const g of topGuards) {
        console.log(fmt(`  ${g.guard ?? "unknown"}:`, Number(g.count)));
      }
    }
    console.log();
  });

// ── budget commands ───────────────────────────────────────────────────────────

const budgetCmd = program.command("budget").description("Budget reporting");

budgetCmd
  .command("report [agentId]")
  .description("Show budget utilization report")
  .action(async (agentId: string | undefined) => {
    const now = Date.now();
    const startOfDay = getStartOfUtcDayMs(now);

    const agentRows = agentId
      ? await db.select().from(agents).where(eq(agents.id, agentId))
      : await db.select().from(agents);

    if (agentRows.length === 0) {
      console.log("\n  No agents found.\n");
      return;
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Budget Report — ${new Date(now).toUTCString()}`);
    console.log(`${"─".repeat(60)}\n`);

    for (const agent of agentRows) {
      const policy = await db
        .select()
        .from(policies)
        .where(eq(policies.agentId, agent.id))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      const daySpend = await db
        .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
        .from(intentLogs)
        .where(
          and(
            eq(intentLogs.agentId, agent.id),
            eq(intentLogs.decision, "allowed"),
            gte(intentLogs.createdAt, startOfDay),
          ),
        )
        .then((rows) => Number(rows[0]?.total ?? 0));

      const maxDailySpend = policy?.maxDailySpend ?? 0;
      const remaining = Math.max(0, maxDailySpend - daySpend);
      const pct = maxDailySpend > 0 ? (daySpend / maxDailySpend) * 100 : 0;
      const statusIcon = pct >= 100 ? "🔴" : pct >= 80 ? "🟡" : "🟢";

      console.log(`  ${statusIcon} ${agent.name} (${agent.id})`);
      console.log(`     Spent today:  $${daySpend.toFixed(2)} / $${maxDailySpend.toFixed(2)}`);
      console.log(`     Remaining:    $${remaining.toFixed(2)}`);
      console.log(`     ${fmtBudgetBar(daySpend, maxDailySpend)}`);
      console.log();
    }
  });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureYoloAgent(agentId: string, budget: number) {
  const now = Date.now();
  const organizationId = "org_limitrum_demo";
  const policyId = `policy_${agentId}`;
  const allowlist = JSON.stringify(["api.stripe.com", "api.openai.com", "api.github.com"]);

  await db
    .insert(organizations)
    .values({ id: organizationId, name: "Limitrum Demo Org", createdAt: now })
    .onConflictDoNothing();

  await db
    .insert(agents)
    .values({
      id: agentId,
      organizationId,
      name: "YOLO Agent",
      environment: "development",
      status: "active",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(policies)
    .values({
      id: policyId,
      agentId,
      maxDailySpend: budget,
      allowedEndpoints: allowlist,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: policies.id,
      set: { maxDailySpend: budget, allowedEndpoints: allowlist, updatedAt: now },
    });
}

program.parse(process.argv);

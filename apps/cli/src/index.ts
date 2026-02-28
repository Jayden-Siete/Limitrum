#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { Command } from "commander";
import { LimitrumGuard } from "@limitrum/sdk";
import { agents, db, intentLogs, organizations, policies } from "@limitrum/db";
import { desc, eq } from "drizzle-orm";

const program = new Command();
const guard = new LimitrumGuard();

program
  .name("limitrum")
  .description("Limitrum CLI - deterministic safety for autonomous agents")
  .version("0.1.0");

program
  .command("simulate")
  .description("Run YOLO-agent cumulative budget simulation")
  .option("--agent-id <agentId>", "Agent identifier")
  .action(async (opts) => {
    const agentId = (opts.agentId as string | undefined) ?? `agent_yolo_${randomUUID().slice(0, 8)}`;
    await ensureYoloAgent(agentId);

    console.log(`\nYOLO simulation for ${agentId}`);
    console.log("Budget: $50.00 | 12 requests x $5.00 to api.openai.com");

    for (let i = 1; i <= 12; i += 1) {
      const startedAt = performance.now();
      const result = await guard.verify({
        agentId,
        action: "openai.chat.completions.create",
        target: "api.openai.com/v1/chat/completions",
        amount: 5,
        estimatedCostUsd: 5,
        metadata: { source: "cli.simulate", mode: "yolo", iteration: i },
      });
      const latencyMs = Math.max(0.01, performance.now() - startedAt);
      console.log(
        `#${String(i).padStart(2, "0")} ${result.decision.toUpperCase()} | amount=$5.00 | latency=${latencyMs.toFixed(2)}ms | ${result.reason}`,
      );
    }

    const latestLogs = await db
      .select()
      .from(intentLogs)
      .where(eq(intentLogs.agentId, agentId))
      .orderBy(desc(intentLogs.createdAt))
      .limit(5);

    console.log("\nRecent DB intent logs:");
    latestLogs.forEach((log) => {
      console.log(
        `- ${new Date(log.createdAt).toISOString()} | ${log.decision.toUpperCase()} | ${log.target} | ${log.reason}`,
      );
    });
  });

async function ensureYoloAgent(agentId: string) {
  const now = Date.now();
  const organizationId = "org_limitrum_demo";
  const policyId = `policy_${agentId}`;
  const allowlist = JSON.stringify(["api.stripe.com", "api.openai.com", "api.github.com"]);

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
      maxDailySpend: 50,
      allowedEndpoints: allowlist,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: policies.id,
      set: {
        maxDailySpend: 50,
        allowedEndpoints: allowlist,
        updatedAt: now,
      },
    });
}

program.parse(process.argv);

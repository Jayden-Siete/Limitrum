#!/usr/bin/env node
import { Command } from "commander";
import { LimitrumGuard } from "@limitrum/sdk";
import { db, intentLogs } from "@limitrum/db";
import { desc, eq } from "drizzle-orm";

const program = new Command();
const guard = new LimitrumGuard();

program
  .name("limitrum")
  .description("Limitrum CLI - deterministic safety for autonomous agents")
  .version("0.1.0");

program
  .command("simulate")
  .description("Run real deterministic policy simulation")
  .option("--agent-id <agentId>", "Agent identifier", "agent_sales_01")
  .action(async (opts) => {
    const agentId = opts.agentId as string;
    const scenarios = [
      {
        label: "Allowed action",
        intent: {
          agentId,
          action: "openai.chat.completions.create",
          target: "api.openai.com/v1/chat/completions",
          amount: 12,
          estimatedCostUsd: 12,
        },
      },
      {
        label: "Blocked action",
        intent: {
          agentId,
          action: "fetch",
          target: "api.unknown-exfil.io/data",
          amount: 8,
          estimatedCostUsd: 8,
        },
      },
    ];

    for (const scenario of scenarios) {
      const result = await guard.verify({
        ...scenario.intent,
        metadata: { source: "cli.simulate", scenario: scenario.label },
      });
      console.log(`\n[${result.decision.toUpperCase()}] ${scenario.label}`);
      console.log(`Action: ${scenario.intent.action} -> ${scenario.intent.target}`);
      console.log(`Reason: ${result.reason}`);
      if (result.policyId) {
        console.log(`Policy: ${result.policyId}`);
      }
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

program.parse(process.argv);

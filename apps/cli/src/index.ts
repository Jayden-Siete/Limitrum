#!/usr/bin/env node
import { Command } from "commander";
import { LimitrumGuard } from "@limitrum/sdk";

const program = new Command();
const guard = new LimitrumGuard();

program
  .name("limitrum")
  .description("Limitrum CLI - deterministic safety for autonomous agents")
  .version("0.1.0");

program
  .command("simulate")
  .description("Simulate intent verification locally")
  .option("-a, --action <action>", "Intent action", "fetch")
  .option("-t, --target <target>", "Intent target", "api.openai.com/v1/chat/completions")
  .option("-c, --cost <cost>", "Estimated cost in USD", "1")
  .action((opts) => {
    const cost = Number(opts.cost);
    const result = guard.verify({
      action: opts.action,
      target: opts.target,
      estimatedCostUsd: Number.isFinite(cost) ? cost : 0,
      metadata: { source: "cli.simulate" },
    });

    const status = result.allowed ? "ALLOWED" : "BLOCKED";
    console.log(`\n[${status}] ${opts.action} -> ${opts.target}`);
    console.log(`Reason: ${result.reason}`);
    if (result.policyId) {
      console.log(`Policy: ${result.policyId}`);
    }
    process.exit(result.allowed ? 0 : 2);
  });

program.parse(process.argv);

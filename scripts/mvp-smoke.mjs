import { spawnSync } from "node:child_process";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args, options = {}) {
const result = spawnSync(pnpm, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (options.allowFailure !== true && result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    throw new Error(`Command failed: pnpm ${args.join(" ")}`);
  }

  return result;
}

function extractJson(output) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not find JSON object in output:\n${output}`);
  }
  return JSON.parse(output.slice(start, end + 1));
}

console.log("Limitrum MVP smoke test");
console.log("1/5 building local workspace packages");
run(["--filter", "@limitrum/db", "build"]);
run(["--filter", "@limitrum/sdk", "build"]);

console.log("2/5 preparing local policy database");
run(["db:migrate"]);
run(["db:seed"]);

console.log("3/5 verifying allowed intent");
const allowed = run([
  "--filter",
  "@limitrum/cli",
  "dev",
  "verify",
  "--agent-id",
  "agent_sales_01",
  "--action",
  "openai.chat.completions.create",
  "--target",
  "api.openai.com/v1/chat/completions",
  "--amount",
  "1",
  "--json",
]);
const allowedVerdict = extractJson(allowed.stdout);
if (allowedVerdict.decision !== "allowed") {
  throw new Error(`Expected allowed verdict, got ${allowedVerdict.decision}: ${allowedVerdict.reason}`);
}

console.log("4/5 verifying blocked exfiltration intent");
const blocked = run(
  [
    "--filter",
    "@limitrum/cli",
    "dev",
    "verify",
    "--agent-id",
    "agent_sales_01",
    "--action",
    "fetch",
    "--target",
    "api.unknown-exfil.io",
    "--amount",
    "1",
    "--json",
  ],
  { allowFailure: true },
);
const blockedVerdict = extractJson(blocked.stdout);
if (blockedVerdict.decision !== "blocked" || blockedVerdict.guardTriggered !== "domain-allowlist") {
  throw new Error(
    `Expected domain-allowlist block, got ${blockedVerdict.decision}/${blockedVerdict.guardTriggered}: ${blockedVerdict.reason}`,
  );
}

console.log("5/5 running zero-cost agent examples");
run(["--filter", "@limitrum/example-yolo-agent", "dev"]);
run(["--filter", "@limitrum/example-mcp-agent", "dev"]);

console.log("MVP smoke test passed: SDK, CLI, DB, policy kernel, adapters, and MCP path are usable.");

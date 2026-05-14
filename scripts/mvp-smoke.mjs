import { spawn, spawnSync } from "node:child_process";

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopProcess(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }
  child.kill("SIGTERM");
}

async function waitForGateway(baseUrl, child) {
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) {
      throw new Error("Gateway process exited before becoming healthy.");
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Keep polling until the dev server has finished booting.
    }
    await sleep(500);
  }
  throw new Error("Gateway did not become healthy in time.");
}

async function runGatewaySmoke() {
  const port = "8791";
  const baseUrl = `http://localhost:${port}`;
  const child = spawn(pnpm, ["--filter", "@limitrum/mcp-server", "dev:sse"], {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    env: {
      ...process.env,
      PORT: port,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForGateway(baseUrl, child);

    const allowed = await fetch(`${baseUrl}/v1/verify-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: {
          agentId: "agent_sales_01",
          action: "stripe.createCharge",
          target: "api.stripe.com/v1/charges",
          amount: 1,
        },
      }),
    }).then((response) => response.json());

    if (allowed.decision !== "allowed") {
      throw new Error(`Expected HTTP gateway allow verdict, got ${allowed.decision}: ${allowed.reason}`);
    }

    const blocked = await fetch(`${baseUrl}/v1/verify-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: {
          agentId: "agent_sales_01",
          action: "fetch",
          target: "api.unknown-exfil.io",
          amount: 1,
        },
      }),
    }).then((response) => response.json());

    if (blocked.decision !== "blocked" || blocked.guardTriggered !== "domain-allowlist") {
      throw new Error(
        `Expected HTTP gateway domain-allowlist block, got ${blocked.decision}/${blocked.guardTriggered}: ${blocked.reason}`,
      );
    }
  } catch (error) {
    if (output) process.stderr.write(output);
    throw error;
  } finally {
    stopProcess(child);
  }
}

console.log("Limitrum MVP smoke test");
console.log("1/9 building local workspace packages");
run(["--filter", "@limitrum/db", "build"]);
run(["--filter", "@limitrum/sdk", "build"]);

console.log("2/9 preparing local policy database");
run(["db:migrate"]);
run(["db:seed"]);

console.log("3/9 verifying allowed intent");
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

console.log("4/9 verifying blocked exfiltration intent");
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

console.log("5/9 running zero-cost agent examples");
run(["--filter", "@limitrum/example-yolo-agent", "dev"]);
run(["--filter", "@limitrum/example-mcp-agent", "dev"]);

console.log("6/9 running protected tool-call example");
run(["example:protected-tool"]);

console.log("7/9 running Mistral tool-call example");
run(["example:mistral-tool"]);

console.log("8/9 running agent tool firewall example");
run(["example:agent-firewall"]);

console.log("9/9 running HTTP gateway verification");
await runGatewaySmoke();

console.log("MVP smoke test passed: SDK, CLI, DB, policy kernel, adapters, MCP path, HTTP gateway, and protected tool calls are usable.");

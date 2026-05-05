# Integrate Limitrum In 5 Minutes

Limitrum sits before sensitive tool execution. Your app sends an intent, the policy kernel returns `ALLOW` or `BLOCK`, and your app only executes the tool when the verdict allows it.

## 1. Run The Local MVP

```bash
git clone https://github.com/Jayden-Siete/Limitrum.git
cd Limitrum
corepack enable
pnpm install
pnpm smoke:mvp
```

If `pnpm` is not available, run `corepack enable` once or use `npx pnpm` in place of `pnpm`.

## 2. Try A Protected Tool Call

```bash
pnpm example:protected-tool
```

The example creates a local demo policy, then runs:

- an allowed Stripe-like action under the per-action cap
- a blocked Stripe-like action over the per-action cap
- a blocked fetch to a non-allowlisted domain

Expected shape:

```text
ALLOW stripe.createCharge $25 ...
BLOCK stripe.createCharge $250 ... guard=budget-per-action
BLOCK fetch unknown domain ... guard=domain-allowlist
```

## 3. Use The SDK Directly

```bash
npm install @limitrum/sdk @limitrum/db
```

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();

const verdict = await guard.verify({
  agentId: "billing-agent",
  action: "stripe.createCharge",
  target: "api.stripe.com/v1/charges",
  amount: 25,
  estimatedCostUsd: 25,
  metadata: {
    source: "agent.tool_call",
    customerId: "cus_123",
  },
});

if (!verdict.allowed) {
  throw new Error(`Blocked by ${verdict.guardTriggered}: ${verdict.reason}`);
}

// Execute the real tool only after the policy verdict allows it.
```

In local mode, configure a policy first through the CLI, repo seed command, or your own database bootstrap. If no policy exists for the agent, Limitrum blocks by default.

## 4. Wrap OpenAI Tool Calls

```ts
import OpenAI from "openai";
import { LimitrumGuard, withLimitrum } from "@limitrum/sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const guard = new LimitrumGuard();

const protectedOpenAI = withLimitrum(openai, guard, {
  agentId: "billing-agent",
});

const result = await protectedOpenAI.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Refund customer cus_123 for $250." }],
  tools: [
    {
      type: "function",
      function: {
        name: "process_refund",
        description: "Process a customer refund",
        parameters: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            amount: { type: "number" },
          },
          required: ["customerId", "amount"],
        },
      },
    },
  ],
});
```

When the model proposes a tool call, the adapter verifies it with Limitrum before your execution path continues.

## 5. Use The MCP Server

```bash
pnpm add @limitrum/mcp-server
```

Local repo mode:

```bash
pnpm --filter @limitrum/mcp-server dev
```

The server exposes:

- `limitrum_guard`: verifies an intent and returns an allow/block verdict

Example MCP tool arguments:

```json
{
  "agentId": "agent_sales_01",
  "action": "tool:process_refund",
  "target": "api.stripe.com/v1/refunds",
  "amount": 50,
  "estimatedCostUsd": 50,
  "metadata": {
    "source": "mcp.agent"
  }
}
```

## What To Test First

```bash
pnpm smoke:mvp
pnpm --filter @limitrum/cli dev simulate
pnpm --filter @limitrum/cli dev verify --agent-id agent_sales_01 --action fetch --target api.unknown-exfil.io --amount 1 --json
```

For concrete product scenarios, see [REAL_WORLD_USE_CASES.md](REAL_WORLD_USE_CASES.md).

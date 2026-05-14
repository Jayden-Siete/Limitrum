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

## 3. Try The Agent Tool Firewall Demo

```bash
pnpm example:agent-firewall
```

This is the clearest product demo. It shows the same policy kernel protecting:

- app-owned tools through `guardTool()`
- OpenAI-style `tool_calls`
- Claude-style `tool_use`
- Mistral-style function calls
- LangChain-style tools before `invoke()`
- shell execution attempts before they run

The key thing to look for is `NOT_EXECUTED` on blocked actions. That means Limitrum stopped the sensitive tool before your code touched the real system.

## 4. Use The SDK Directly

```bash
npm install @limitrum/sdk @limitrum/db
```

```ts
import { LimitrumGuard, guardTool } from "@limitrum/sdk";

const guard = new LimitrumGuard();

const chargeCustomer = guardTool(guard, {
  agentId: "billing-agent",
  toolName: "stripe.createCharge",
  target: "api.stripe.com/v1/charges",
  amount: ({ input }) => input.amount,
  execute: async (input) => {
    // Execute the real tool only after Limitrum returns ALLOW.
    return stripe.charges.create({
      customer: input.customerId,
      amount: input.amount * 100,
      currency: "usd",
    });
  },
});

const result = await chargeCustomer({
  customerId: "cus_123",
  amount: 25,
});

if (!result.executed) {
  throw new Error(`Blocked by ${result.verdict.guardTriggered}: ${result.verdict.reason}`);
}
```

In local mode, configure a policy first through the CLI, repo seed command, or your own database bootstrap. If no policy exists for the agent, Limitrum blocks by default.

## 5. Wrap OpenAI Tool Calls

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

## 6. Use The MCP Server

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

## 7. Use The HTTP Gateway

Run the local verification API:

```bash
pnpm gateway:dev
```

Call the policy kernel over HTTP:

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d '{"intent":{"agentId":"agent_sales_01","action":"fetch","target":"api.unknown-exfil.io","amount":1}}'
```

Point the SDK at the gateway:

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard({
  baseUrl: "http://localhost:8788",
});
```

For the full gateway path, see [HOSTED_GATEWAY.md](HOSTED_GATEWAY.md).

## What To Test First

```bash
pnpm smoke:mvp
pnpm gateway:dev
pnpm --filter @limitrum/cli dev simulate
pnpm --filter @limitrum/cli dev verify --agent-id agent_sales_01 --action fetch --target api.unknown-exfil.io --amount 1 --json
```

For concrete product scenarios, see [REAL_WORLD_USE_CASES.md](REAL_WORLD_USE_CASES.md).

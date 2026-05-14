# Agent Tool Firewall

Limitrum's strongest product shape is simple:

```text
AI agent -> Limitrum -> tool/API/database/shell
```

The model can propose an action. Limitrum decides whether that action is allowed to execute.

This matters because most agent frameworks leave tool execution in the developer's hands. OpenAI tool calls, Claude `tool_use`, Mistral function calling, LangChain tools, and MCP all follow the same practical pattern: the model proposes a structured action, then application code executes it.

Limitrum protects that handoff.

## What Ships In The MVP

The open-source core now gives developers three integration paths:

1. `guardTool()` for app-owned tools.
2. Provider adapters for OpenAI, Claude/Anthropic, Mistral, and LangChain-style tools.
3. `@limitrum/mcp-server`, which exposes `limitrum_guard` to MCP-compatible agents.

The hosted product will add centralized policies, team workflows, hosted keys, long-term audit retention, SIEM export, and enterprise deployment options. The local core is enough to prove the runtime enforcement primitive today.

## The `guardTool()` Pattern

Use this when your app owns the function that touches Stripe, GitHub, shell, a database, or an internal API.

```ts
import { LimitrumGuard, guardTool } from "@limitrum/sdk";

const guard = new LimitrumGuard();

const chargeCustomer = guardTool(guard, {
  agentId: "billing-agent",
  toolName: "stripe.createCharge",
  target: "api.stripe.com/v1/charges",
  amount: ({ input }) => input.amount,
  execute: async (input) => {
    // The real Stripe call only happens after Limitrum returns ALLOW.
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
  console.log(result.verdict.guardTriggered, result.verdict.reason);
}
```

When Limitrum blocks, the wrapped tool does not run.

## Public Demo To Run

```bash
pnpm example:agent-firewall
```

The demo creates a local policy and shows:

- `ALLOW` for a Stripe-like action under the cap.
- `BLOCK` for a Stripe-like action above the per-action cap.
- `BLOCK` for a fetch to a non-allowlisted domain.
- `BLOCK` for a destructive shell command before execution.
- OpenAI-style, Claude-style, Mistral-style, and LangChain-style tool calls being checked before execution.

Expected shape:

```text
Limitrum Agent Tool Firewall
agent=agent_firewall_xxxxx
policy=allow Stripe/GitHub/model APIs, cap=$100/action, block exfiltration and shell

1) App-owned tools protected with guardTool()
ALLOW EXECUTED     stripe.createCharge $25
BLOCK NOT_EXECUTED stripe.createCharge $250       guard=budget-per-action
BLOCK NOT_EXECUTED fetch unknown domain           guard=domain-allowlist
BLOCK NOT_EXECUTED shell.exec rm -rf              guard=syscall-protection

2) Provider adapters gate model-proposed tool calls
OPENAI    OpenAI-style tool call was blocked before execution...
CLAUDE    Claude-style tool_use was blocked before execution...
MISTRAL   Mistral-style function call was blocked before execution...

3) LangChain-style tools are wrapped before invoke()
LANGCHAIN Limitrum Policy Enforcement: Action blocked...
```

## MCP Gateway Shape

The local MCP server exposes a guard tool:

```bash
pnpm --filter @limitrum/mcp-server dev
```

Tool name:

```text
limitrum_guard
```

Arguments:

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

In an MCP setup, the agent or gateway calls `limitrum_guard` before sensitive tools. If the verdict is blocked, the sensitive tool is not called.

The same server can also run as a local HTTP verification gateway:

```bash
pnpm gateway:dev
```

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d '{"intent":{"agentId":"agent_sales_01","action":"fetch","target":"api.unknown-exfil.io","amount":1}}'
```

See `docs/HOSTED_GATEWAY.md` for the complete HTTP path.

The next commercial-grade step is a full MCP proxy that sits between an agent and a set of real MCP servers:

```text
Claude Desktop / Cursor / agent
  -> Limitrum MCP Gateway
  -> GitHub MCP / shell MCP / database MCP / internal MCP tools
```

That proxy should apply the same `ALLOW` / `BLOCK` decision before forwarding any risky tool call downstream.

## Positioning

Use this sentence publicly:

> Limitrum lets developers give AI agents real tools without giving them unlimited power.

Use this technical explanation:

> Limitrum is a policy kernel for model-generated tool calls. It verifies intent before execution and returns a deterministic `ALLOW` or `BLOCK` verdict with an audit-ready reason.

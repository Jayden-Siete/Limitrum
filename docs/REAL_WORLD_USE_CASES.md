# Real-World Use Cases

Limitrum protects the execution layer of AI agents. It does not try to control the model's text output. It sits between a model-generated tool call and the code that would actually touch money, data, infrastructure, or external APIs.

The practical loop is:

1. A model such as OpenAI, Claude, Mistral, or a LangChain agent proposes a tool call.
2. Your application sends the proposed action to `LimitrumGuard.verify`.
3. Limitrum returns `ALLOW` or `BLOCK` with a reason and `guardTriggered`.
4. Your application only executes the real tool when the verdict allows it.

This is the important product claim: Limitrum does not make the model safer by persuasion. It makes the execution path safer by enforcing a policy outside the model.

## What Works Today

| Integration path | Status | What it protects |
| --- | --- | --- |
| SDK direct call | Works | Any app that can call `LimitrumGuard.verify` before tool execution |
| OpenAI adapter | Works | OpenAI-style `tool_calls` before the developer executes the function |
| Claude / Anthropic adapter | Works | Claude `tool_use` blocks before the developer executes the tool |
| Mistral adapter | Works | Mistral function calls before the developer executes the function |
| LangChain wrapper | Works | LangChain tools and toolkits before `invoke` or `call` |
| MCP server | Works | Any MCP-compatible agent that calls `limitrum_guard` before a sensitive tool |

Official tool-calling docs that match this model:

- OpenAI: https://platform.openai.com/docs/guides/function-calling
- Anthropic Claude: https://docs.claude.com/en/docs/tool-use
- Mistral: https://docs.mistral.ai/capabilities/function_calling/

## Use Case 1: AI Coding Agent With Shell And GitHub Tools

A developer has an agent that can:

- read files
- open pull requests
- create GitHub issues
- run shell commands
- call deployment APIs

Limitrum can sit before the shell, GitHub, and deployment tools.

Example policy:

- allow `github.createIssue`
- allow `github.openPullRequest`
- block `shell.exec` for destructive commands
- block deploy calls outside staging
- rate-limit repeated tool loops

What you can show publicly:

```bash
pnpm --filter @limitrum/cli dev verify --agent-id agent_sales_01 --action shell.exec --target /bin/sh --amount 0 --json
```

Expected outcome: `BLOCK` with a syscall or destructive-action reason.

## Use Case 2: AI Customer Support Agent With Refunds

A support agent can answer tickets and propose refunds. The risky part is not the answer; it is the refund tool.

Limitrum can enforce:

- refunds under `$100` are allowed
- refunds above `$100` are blocked or require a different approval path
- Stripe must be allowlisted
- unknown payment APIs are blocked
- every decision is logged

Run:

```bash
pnpm example:protected-tool
```

Expected outcome:

```text
ALLOW stripe.createCharge $25 ...
BLOCK stripe.createCharge $250 ... guard=budget-per-action
BLOCK fetch unknown domain ... guard=domain-allowlist
```

## Use Case 3: AI Research Agent With Network Access

A research agent can browse approved vendor docs, but it should not send internal data to unknown domains.

Limitrum can enforce:

- allow `vendor-docs.com`
- allow `api.github.com`
- block `api.unknown-exfil.io`
- log every blocked request with the agent ID and policy ID

This is where target extraction matters. If a model proposes:

```json
{
  "url": "api.unknown-exfil.io/customer-export"
}
```

the adapters pass that `url` to the policy kernel instead of only checking the model provider endpoint.

## Use Case 4: Mistral Function Calling

Mistral's function-calling flow still leaves function execution on the developer side. That is exactly where Limitrum fits.

Run:

```bash
pnpm example:mistral-tool
```

Expected outcome:

```text
First model response proposed: tool:fetch_url -> api.unknown-exfil.io/customer-export
Limitrum verdict: BLOCK guard=domain-allowlist
```

## Use Case 5: MCP Agent Guardrail

MCP-compatible agents can discover `limitrum_guard` as a tool and ask for a verdict before calling sensitive tools.

Run:

```bash
pnpm --filter @limitrum/example-mcp-agent dev
```

This is useful for developer tooling because MCP is a common way to connect agents to local tools, internal systems, and IDE workflows.

## What Limitrum Does Not Claim Yet

Limitrum does not currently:

- control ChatGPT, Claude, or Mistral consumer apps directly
- prevent every possible bad text answer from a model
- replace auth, RBAC, human approval, or infrastructure-level permissions
- provide a hosted dashboard in the open-source core

The open-source MVP protects developer-owned execution paths. That is enough for real users who are building agents with tools.

## Best First Public Demo

The strongest public demo is not a dashboard. It is a terminal recording:

1. Show an agent proposing a refund or fetch tool call.
2. Show Limitrum receiving the intent.
3. Show `ALLOW` for the safe action.
4. Show `BLOCK` for high spend or unknown domain.
5. Show that the blocked tool never executes.

Use this command set:

```bash
corepack enable
pnpm install
pnpm smoke:mvp
pnpm example:protected-tool
pnpm example:mistral-tool
pnpm --filter @limitrum/example-mcp-agent dev
```

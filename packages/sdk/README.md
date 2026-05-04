# @limitrum/sdk

TypeScript policy kernel SDK for verifying autonomous AI agent actions before execution.

```bash
pnpm add @limitrum/sdk @limitrum/db
```

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();

const verdict = await guard.verify({
  agentId: "agent_sales_01",
  action: "openai.chat.completions.create",
  target: "api.openai.com/v1/chat/completions",
  amount: 1,
});

if (!verdict.allowed) {
  throw new Error(verdict.reason);
}
```

Configure a local policy first through the CLI, repo seed command, or your own database bootstrap. If no policy exists for the agent, the guard blocks by default.

Adapters included today:

- `withLimitrum` for OpenAI-style `tool_calls`
- `withLimitrumAnthropic` for Claude / Anthropic `tool_use` blocks
- `withLimitrumMistral` for Mistral function calling
- `withLimitrumTool` and `withLimitrumToolkit` for LangChain tools

Adapters extract risky targets from tool arguments such as `target`, `url`, `endpoint`, `domain`, `host`, and `apiUrl` before falling back to the model provider endpoint.

This package is part of the Limitrum alpha MVP. I am keeping the core policy-kernel SDK open so developers can inspect how verdicts are produced before trusting it in agent workflows.

See the main repository README for setup, CLI usage, MCP usage, and the open-core boundary.

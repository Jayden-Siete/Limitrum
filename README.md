# Limitrum

Limitrum is the open-source Policy Kernel and Risk Engine for autonomous AI agents.

**Core promise:** deploy autonomous agents with absolute confidence.

In a world of claws, build a shell.

## V1.4 Scope (Open Source)

V1.4 delivers a production-oriented universal foundation:

- `@limitrum/sdk`: deterministic guard contract (`verify(intent)`)
- `@limitrum/mcp-server`: MCP server exposing `limitrum_guard` tool over stdio/SSE
- `@limitrum/cli`: local simulation (`limitrum simulate`)
- `@limitrum/api`: policy verification endpoint (`POST /v1/verify-intent`)
- `@limitrum/db`: Drizzle schema + SQLite connection for local-first workflows
- `@limitrum/web`: premium dark-mode landing + interactive sandbox

## Monorepo Structure

- `apps/web` - Next.js App Router landing and interactive sandbox
- `apps/api` - Hono Policy Kernel API
- `apps/cli` - Node CLI tooling via Commander
- `apps/mcp-server` - MCP server exposing `limitrum_guard` for MCP clients
- `packages/sdk` - Shared TypeScript SDK
- `packages/db` - Drizzle ORM schema + local SQLite (`@libsql/client`) client
- `apps/examples/yolo-agent` - zero-cost OpenAI integration simulation with real policy enforcement
- `apps/examples/mcp-agent` - zero-cost MCP client simulation against local MCP server

## Quick Start

1. Install dependencies

```bash
pnpm install
```

2. Start all dev targets

```bash
pnpm dev
```

3. Or run each workspace directly

```bash
pnpm --filter @limitrum/web dev
pnpm --filter @limitrum/api dev
pnpm --filter @limitrum/cli dev -- simulate
pnpm --filter @limitrum/mcp-server dev
```

## Example: SDK Guard

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();
const verdict = await guard.verify({
  agentId: "agent_sales_01",
  action: "fetch",
  target: "api.openai.com/v1/chat/completions",
  amount: 2.5,
  estimatedCostUsd: 2.5,
});
```

## Real-World LLM Adapter (Zero-Cost Simulation)

`@limitrum/sdk` includes adapters for OpenAI, Anthropic, and LangChain integration points:

- `withLimitrum(openaiClient, guard, { agentId })` inspects tool calls from the LLM response
- `withLimitrumAnthropic(anthropicClient, guard, { agentId })` inspects Anthropic `tool_use` calls from `messages.create`
- `withLimitrumTool(tool, guard, { agentId })` wraps a single LangChain-style tool
- `withLimitrumToolkit(tools, guard, { agentId })` wraps an entire toolkit array automatically
- each tool call is validated by `guard.verify(...)`
- if blocked, Limitrum injects a system message back to the model:
  - `Limitrum Policy Enforcement: Action blocked because <reason>`
- no tool is executed when policy blocks the action

Run the local zero-cost demonstration:

```bash
pnpm --filter @limitrum/db seed
pnpm --filter @limitrum/example-yolo-agent dev
```

This demo uses the official `openai` SDK but mocks network responses locally, so no API key spend is required.

## MCP Server (Universal Client Support)

`@limitrum/mcp-server` exposes one MCP tool:

- `limitrum_guard` -> deterministic policy evaluation via `LimitrumGuard.verify(...)`

Supported transports:

- **stdio** (default): for local MCP clients (Cursor, Claude Desktop, Gemini CLI, Codex-compatible clients)
- **SSE**: for HTTP/SSE MCP integrations

Run MCP server:

```bash
pnpm --filter @limitrum/mcp-server dev
pnpm --filter @limitrum/mcp-server dev:sse
```

Zero-cost MCP interaction demo:

```bash
pnpm --filter @limitrum/db seed
pnpm --filter @limitrum/example-mcp-agent dev
```

## Web CLI vs Real CLI

- The web CLI in `@limitrum/web` is a visitor-facing visual simulation, so unknown commands can show "command not found".
- The real executable CLI is `@limitrum/cli` and runs in your terminal (`pnpm --filter @limitrum/cli dev -- simulate`).

## Security & GitOps Baseline

- Branch model:
  - `main` for releases/production
  - `dev` for active engineering
- Secrets policy:
  - `.env*` files are ignored
  - only `.env.example` files are tracked
- Local databases (`*.sqlite`, `*.db*`) are ignored by default

## License

This repository is intended for open-source distribution.

# How Limitrum Works And How To Test It

Limitrum is a policy kernel for autonomous AI agents.

Before an agent executes a sensitive tool call, your app sends an intent to Limitrum. Limitrum checks policy, returns a deterministic verdict, and records the decision locally.

## What Is In This Repository

This public repo contains the open-source core:

- `packages/sdk`: TypeScript SDK with `LimitrumGuard`
- `packages/db`: local SQLite/libSQL schema and seed data
- `apps/cli`: local command-line simulator
- `apps/mcp-server`: MCP tool server for local agent enforcement
- `apps/examples`: zero-cost agent simulations
- `apps/web`: public website

The hosted API, dashboard, team workspaces, hosted key lifecycle, SIEM export, SSO, and enterprise deployments are commercial product surface and are intentionally not included here.

## Runtime Flow

1. Agent plans a tool call.
2. App creates an intent: `agentId`, `action`, `target`, cost estimate, metadata.
3. `LimitrumGuard.verify()` checks the intent.
4. The kernel loads local policy.
5. Guards run in order: syscall, domain, budget, per-action cap, rate limit, loop detection, destructive action, data exfiltration, prompt injection, custom patterns.
6. Limitrum returns `allowed` or `blocked` with a reason.
7. The local audit log records the decision.
8. Your app executes the tool only if `allowed` is true.

## Local Setup

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

## Run The CLI Simulation

```bash
pnpm --filter @limitrum/cli dev simulate
```

Try a stricter run:

```bash
pnpm --filter @limitrum/cli dev simulate --requests 20 --amount 50
```

## Verify One Intent

Allowed target:

```bash
pnpm --filter @limitrum/cli dev verify \
  --agent-id agent_sales_01 \
  --action openai.chat.completions.create \
  --target api.openai.com/v1/chat/completions \
  --amount 1
```

Blocked target:

```bash
pnpm --filter @limitrum/cli dev verify \
  --agent-id agent_sales_01 \
  --action fetch \
  --target api.unknown-exfil.io \
  --amount 1
```

JSON output for automation:

```bash
pnpm --filter @limitrum/cli dev verify \
  --agent-id agent_sales_01 \
  --action fetch \
  --target api.unknown-exfil.io \
  --amount 1 \
  --json
```

Add `--fail-on-block` if you want a blocked verdict to exit with code `2` in CI.

## Run The MCP Server

```bash
pnpm --filter @limitrum/mcp-server dev
```

SSE mode:

```bash
pnpm --filter @limitrum/mcp-server dev:sse
```

## Run The Website

```bash
pnpm --filter @limitrum/web dev
```

Open `http://localhost:3000`.

## Run Tests

```bash
pnpm test:unit
pnpm typecheck
pnpm lint
pnpm build
pnpm smoke:mvp
```

## MVP Status

Ready for public developer demos:

- local policy kernel works
- SDK adapters are implemented
- CLI simulation works without model spend
- CLI one-off verification returns allow/block verdicts
- MCP server exposes a guard tool
- local audit and budget behavior are testable
- `pnpm smoke:mvp` validates the MVP path end to end

Commercial roadmap:

- hosted policy API
- production dashboard
- team workspaces
- hosted key lifecycle
- long-term audit retention
- SIEM export
- SSO / SCIM / RBAC
- VPC or on-prem deployment

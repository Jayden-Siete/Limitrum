# Limitrum

Limitrum is the open-source Policy Kernel and Risk Engine for autonomous AI agents.

**Core promise:** deploy autonomous agents with absolute confidence.

In a world of claws, build a shell.

## Phase 1 Scope (Open Source)

Phase 1 delivers a production-oriented foundation:

- `@limitrum/sdk`: deterministic guard contract (`verify(intent)`)
- `@limitrum/cli`: local simulation (`limitrum simulate`)
- `@limitrum/api`: policy verification endpoint (`POST /v1/verify-intent`)
- `@limitrum/db`: Drizzle schema + SQLite connection for local-first workflows
- `@limitrum/web`: premium dark-mode landing + interactive sandbox

## Monorepo Structure

- `apps/web` - Next.js App Router landing and interactive sandbox
- `apps/api` - Hono Policy Kernel API
- `apps/cli` - Node CLI tooling via Commander
- `packages/sdk` - Shared TypeScript SDK
- `packages/db` - Drizzle ORM schema + better-sqlite3 client

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
```

## Example: SDK Guard

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();
const verdict = guard.verify({
  action: "fetch",
  target: "api.openai.com/v1/chat/completions",
  estimatedCostUsd: 2.5,
});
```

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

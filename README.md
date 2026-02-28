# Limitrum

![Limitrum](.github/assets/limitrum-logo.svg)

**The safety engine for autonomous systems.**  
Deploy autonomous agents with deterministic policy enforcement, auditable decisions, and zero-cost local simulation.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-orange)](#)

## Architecture

```mermaid
flowchart LR
    Agent[AutonomousAgent] --> SDK[LimitrumSDK]
    SDK --> Kernel[PolicyKernel]
    Kernel --> Audit[SQLiteAuditLogs]
```

## Why Limitrum?

- **Deterministic safety**: every tool/action intent is evaluated by explicit policy rules.
- **Low overhead**: in-process policy checks keep latency low for critical agent loops.
- **Privacy-first**: local SQLite + local simulation workflows avoid unnecessary third-party data exposure.

## Monorepo Overview

- `apps/web` - Next.js landing page + interactive sandbox
- `apps/api` - Hono Policy Kernel API (`POST /v1/verify-intent`)
- `apps/cli` - terminal CLI simulation (`limitrum simulate`)
- `apps/mcp-server` - MCP server exposing `limitrum_guard` via stdio/SSE
- `apps/examples/yolo-agent` - zero-cost OpenAI adapter simulation
- `apps/examples/mcp-agent` - zero-cost MCP client simulation
- `packages/sdk` - guard + universal adapters (OpenAI, Anthropic, LangChain)
- `packages/db` - schema + local SQLite client

## Quickstart

### 1) Clone and install

```bash
git clone https://github.com/Jayden-Siete/Limitrum.git
cd Limitrum
pnpm install
```

### 2) Seed local policy data

```bash
pnpm --filter @limitrum/db seed
```

### 3) Run the zero-cost YOLO agent example

```bash
pnpm --filter @limitrum/example-yolo-agent dev
```

This example simulates an LLM tool-call path locally and demonstrates enforcement without paid API usage.

## MCP Support

Limitrum provides a production-grade MCP server so any MCP client can consume policy enforcement as a tool.

- Tool: `limitrum_guard`
- Transports:
  - `stdio` (default)
  - `SSE`

Run it:

```bash
pnpm --filter @limitrum/mcp-server dev
pnpm --filter @limitrum/mcp-server dev:sse
```

Run MCP simulation:

```bash
pnpm --filter @limitrum/example-mcp-agent dev
```

## SDK Adapters

- OpenAI: `withLimitrum(...)`
- Anthropic: `withLimitrumAnthropic(...)`
- LangChain tool: `withLimitrumTool(...)`
- LangChain toolkit: `withLimitrumToolkit(...)`

All adapters delegate to `LimitrumGuard.verify(...)` and apply hard policy-block responses consistently.

## Security

- `.env` files are ignored; only `.env.example` is tracked.
- local databases (`*.sqlite`, `*.db*`) are ignored.
- report vulnerabilities via `SECURITY.md`.

## License

MIT. See [LICENSE](LICENSE).

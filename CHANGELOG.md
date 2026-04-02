# Changelog

All notable changes to Limitrum are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Limitrum adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `CtaBlock` component — "Stop trusting. Start enforcing." CTA section
- `Footer` component — logo, nav links, copyright, open beta badge
- CTA block and Footer CSS styles in `globals.css`
- LangChain adapter unit tests (`withLimitrumTool`, `withLimitrumToolkit`)
- Integration tests for all API routes (`/v1/verify-intent`, `/v1/agents`, `/v1/agents/:id/policy`, `/v1/logs`, `/v1/budget/report`, `/v1/api-keys`)
- `vitest.integration.config.ts` — separate integration test runner config
- `test:unit` and `test:integration` scripts in `tests/package.json`
- GitHub Actions CI workflow (typecheck, lint, unit tests, build)
- GitHub Actions Release workflow (automated GitHub Releases on version tags)
- Enhanced `Features` component with icons and rich descriptions
- Enhanced `Pricing` component with featured Pro card and feature lists
- Missing CSS classes: `.stb-title`, `.term-title`, `.sr-status`, `.sr-latency`, `.agent-card-body`, `.feat-icon`
- Pricing CSS: `.pc-featured`, `.pc-badge`, `.pc-period`, `.pc-features`, `.pc-feature-item`, `.pc-check`, `.pc-btn-featured`
- OpenAI adapter unit tests
- Anthropic adapter unit tests (top-level `system` param validation)
- Auth middleware unit tests (SHA256 hashing, expiry, master key bypass)

### Fixed
- Anthropic adapter: system message now uses top-level `system:` param instead of `messages[{role:"system"}]`
- CSS comment syntax: replaced `──` Unicode dashes with plain ASCII to prevent CSS parser errors

### Changed
- `LandingPage` now renders `CtaBlock` and `Footer` after `Pricing`

---

## [0.1.0] — 2025-01-01

### Added
- Initial monorepo structure with Turborepo + pnpm workspaces
- `packages/db` — SQLite schema (organizations, agents, policies, intentLogs, apiKeys) via Drizzle ORM + libsql
- `packages/sdk` — `LimitrumGuard` with 10 behavioral guards:
  - Domain allowlist
  - Daily budget cap
  - Per-action cost cap
  - Rate limiting (per minute)
  - Loop detection
  - Syscall protection
  - Destructive action blocking
  - Data exfiltration prevention
  - Prompt injection detection
  - Custom blocked patterns
- `packages/sdk` — Adapters: OpenAI (`withLimitrum`), Anthropic (`withLimitrumAnthropic`), LangChain (`withLimitrumTool`, `withLimitrumToolkit`)
- `apps/api` — Hono.js REST API on port 8000:
  - `POST /v1/verify-intent` — public policy enforcement endpoint
  - `GET /v1/agents` — list agents
  - `POST /v1/agents` — create agent
  - `PATCH /v1/agents/:id` — update agent
  - `DELETE /v1/agents/:id` — delete agent
  - `GET /v1/agents/:id/status` — agent status
  - `GET /v1/agents/:id/policy` — get policy
  - `PUT /v1/agents/:id/policy` — replace policy
  - `PATCH /v1/agents/:id/policy` — partial update policy
  - `DELETE /v1/agents/:id/policy` — delete policy
  - `GET /v1/logs` — paginated intent logs with filters
  - `GET /v1/logs/:id` — single log entry
  - `GET /v1/budget/report` — all agents budget report
  - `GET /v1/budget/report/:agentId` — per-agent budget report
  - `GET /v1/api-keys` — list API keys
  - `POST /v1/api-keys` — create API key
  - `DELETE /v1/api-keys/:id` — revoke API key
- `apps/api` — Auth middleware: SHA256 API key hashing, expiry support, master key bypass
- `apps/cli` — Commander.js CLI: `simulate`, `agent`, `policy`, `logs`, `budget` commands
- `apps/mcp-server` — MCP server with `limitrum_guard` tool (stdio + SSE transports)
- `apps/web` — Next.js 15 landing page with interactive sandbox
- `apps/examples/yolo-agent` — zero-cost OpenAI adapter simulation
- `apps/examples/mcp-agent` — zero-cost MCP client simulation
- `packages/db/src/seed.ts` — demo data seeding with all policy fields and API key

[Unreleased]: https://github.com/Jayden-Siete/Limitrum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.0

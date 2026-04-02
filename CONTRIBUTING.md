# Contributing to Limitrum

Thanks for your interest in contributing to Limitrum — the safety engine for autonomous systems.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Branching and Commits](#branching-and-commits)
- [Pull Request Checklist](#pull-request-checklist)
- [Code Style](#code-style)
- [Reporting Issues](#reporting-issues)

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10 (`npm install -g pnpm`)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Jayden-Siete/Limitrum.git
cd Limitrum

# 2. Install all workspace dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env

# 4. Build internal packages (required before running apps)
pnpm --filter @limitrum/db build
pnpm --filter @limitrum/sdk build

# 5. Seed the local SQLite database with demo data
pnpm --filter @limitrum/db seed

# 6. Start the API + web dev servers
pnpm dev
```

### Individual apps

```bash
# API server only (port 8000)
pnpm --filter @limitrum/api dev

# Web landing page only (port 3000)
pnpm --filter @limitrum/web dev

# CLI simulation
pnpm --filter @limitrum/cli dev -- simulate

# MCP server (stdio)
pnpm --filter @limitrum/mcp-server dev

# MCP server (SSE)
pnpm --filter @limitrum/mcp-server dev:sse

# YOLO agent example (zero-cost simulation)
pnpm --filter @limitrum/example-yolo-agent dev

# MCP agent example
pnpm --filter @limitrum/example-mcp-agent dev
```

---

## Project Structure

```
Limitrum/
├── apps/
│   ├── api/          # Hono.js REST API (port 8000)
│   ├── cli/          # Commander.js CLI
│   ├── mcp-server/   # MCP server (stdio + SSE)
│   ├── web/          # Next.js 15 landing page
│   └── examples/
│       ├── yolo-agent/   # Zero-cost OpenAI adapter demo
│       └── mcp-agent/    # Zero-cost MCP client demo
├── packages/
│   ├── db/           # Drizzle ORM schema + SQLite client
│   └── sdk/          # LimitrumGuard + adapters
└── tests/
    ├── unit/         # Unit tests (vitest)
    └── integration/  # Integration tests (vitest, requires live API)
```

---

## Running Tests

```bash
# All unit tests
pnpm --filter @limitrum/tests test:unit

# All integration tests (requires API running on port 8000)
pnpm --filter @limitrum/tests test:integration

# With coverage
pnpm --filter @limitrum/tests test:coverage

# Watch mode
pnpm --filter @limitrum/tests test:watch
```

---

## Branching and Commits

- **Base branch for active work**: `dev`
- **Stable branch**: `main` (merged from `dev` on releases)
- Keep pull requests focused and atomic
- Follow [Conventional Commits](https://www.conventionalcommits.org/) style:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructure without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build, CI, tooling changes |
| `perf:` | Performance improvement |
| `style:` | Formatting, whitespace |
| `ci:` | CI/CD pipeline changes |

### Examples

```
feat(sdk): add per-action cost cap guard
fix(anthropic): use top-level system param instead of messages array
test(api): add integration tests for /v1/api-keys
docs: update CONTRIBUTING.md with project structure
ci: add GitHub Actions CI workflow
```

---

## Pull Request Checklist

- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm --filter @limitrum/tests test:unit` passes
- [ ] New behavior is covered by tests
- [ ] Docs updated for user-facing changes
- [ ] No secrets committed (`.env`, API keys, credentials)
- [ ] CHANGELOG.md updated under `[Unreleased]`

---

## Code Style

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **Small, composable modules** — one responsibility per file
- **Deterministic policy logic** — guards must be predictable and auditable
- **Explicit error messages** — always explain *why* something was blocked
- **No silent failures** — log or throw, never swallow errors

---

## Reporting Issues

- Use clear reproduction steps
- Include environment details (`node --version`, `pnpm --version`, OS)
- Attach relevant logs or error output
- For security-sensitive issues, follow the process in [`SECURITY.md`](SECURITY.md)

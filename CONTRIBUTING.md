# Contributing to Limitrum

Thanks for helping improve Limitrum, the policy kernel for autonomous AI agents.

## Development Setup

Prerequisites:

- Node.js >= 20
- pnpm >= 10

```bash
git clone https://github.com/Jayden-Siete/Limitrum.git
cd Limitrum
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm build
```

## Useful Commands

```bash
pnpm --filter @limitrum/web dev
pnpm --filter @limitrum/cli dev -- simulate
pnpm --filter @limitrum/mcp-server dev
pnpm test:unit
pnpm typecheck
pnpm lint
pnpm build
```

## Project Structure

```text
apps/
  cli/                 Local CLI simulator and policy tools
  mcp-server/          MCP server
  web/                 Public website
  examples/            Zero-cost local examples
packages/
  db/                  SQLite schema and seed data
  sdk/                 Policy kernel and adapters
tests/
  unit/                SDK and adapter tests
docs/                  Architecture and product boundary docs
```

## Open-Core Boundary

Please keep commercial hosted-product code out of this public repository.

Open-source contributions should target:

- policy kernel behavior
- SDK adapters
- local audit and policy storage
- CLI and MCP workflows
- docs, examples, and tests

Do not add:

- hosted Cloud API implementation
- billing or usage metering
- customer dashboard code
- team workspace/RBAC/SSO implementations
- SIEM export or long-term hosted retention
- private deployment runbooks or customer-specific configs

See [docs/COMMERCIAL_BOUNDARY.md](docs/COMMERCIAL_BOUNDARY.md).

## Pull Request Checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:unit` passes
- [ ] `pnpm build` passes
- [ ] docs are updated for user-facing changes
- [ ] no secrets, local databases, or generated artifacts are committed

## Commit Style

Use Conventional Commits:

- `feat:` new capability
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `chore:` tooling or maintenance
- `refactor:` internal code structure

## Security

For vulnerabilities, do not open a public issue. Follow [SECURITY.md](SECURITY.md).

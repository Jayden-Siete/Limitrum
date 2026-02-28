# Contributing to Limitrum

Thanks for contributing to Limitrum.

## Development Setup

1. Install dependencies:

```bash
pnpm install
```

2. Run type checks:

```bash
pnpm typecheck
```

3. Run workspace dev targets as needed:

```bash
pnpm dev
pnpm --filter @limitrum/cli dev -- simulate
pnpm --filter @limitrum/mcp-server dev
```

## Branching and Commits

- Base branch for active work: `dev`
- Keep pull requests focused and atomic
- Follow Conventional Commit style:
  - `feat: ...`
  - `fix: ...`
  - `docs: ...`
  - `refactor: ...`
  - `test: ...`
  - `chore: ...`

## Pull Request Checklist

- Ensure `pnpm typecheck` passes
- Add or update docs for user-facing changes
- Include tests or simulation proof when behavior changes
- Confirm no secrets are committed (`.env`, keys, credentials)

## Code Style

- Use TypeScript with strict typing
- Prefer small, composable modules
- Keep policy logic deterministic and auditable

## Reporting Issues

- Use clear reproduction steps
- Include environment details and relevant logs
- For security-sensitive issues, use the process in `SECURITY.md`

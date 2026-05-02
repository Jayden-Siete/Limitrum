# Changelog

All notable changes to Limitrum are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

No unreleased changes yet.

## [0.1.0] - 2026-05-02

### Added

- TypeScript SDK with `LimitrumGuard`
- local SQLite/libSQL policy store
- deterministic guards for budgets, domains, rate limits, syscall protection, destructive actions, data exfiltration, prompt injection, loops, and blocked patterns
- OpenAI, Anthropic, and LangChain adapters
- local CLI simulator
- MCP server
- zero-cost local examples
- unit tests
- public website
- `limitrum verify` CLI command for one-off allow/block verdicts
- `pnpm smoke:mvp` end-to-end MVP smoke test
- MVP demo GIF/MP4 for the GitHub README
- package README files and npm publish metadata for SDK, DB, CLI, and MCP server
- `docs/ARCHITECTURE.md`
- `docs/COMMERCIAL_BOUNDARY.md`

### Changed

- Repositioned the public repository as the open-source core.
- Replaced the public website with the new Limitrum Vite landing site.
- Clarified the commercial boundary for hosted Cloud/API/dashboard capabilities.
- Clarified standalone CLI npm quickstart behavior.
- Cleaned the release workflow copy and install instructions.
- Removed hosted API implementation, Cloud Run deployment files, production runbook, and API integration tests from the public repo.

[Unreleased]: https://github.com/Jayden-Siete/Limitrum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.0

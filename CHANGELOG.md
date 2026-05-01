# Changelog

All notable changes to Limitrum are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed

- Repositioned the public repository as the open-source core.
- Replaced the public website with the new Limitrum Vite landing site.
- Clarified the commercial boundary for hosted Cloud/API/dashboard capabilities.
- Removed hosted API implementation, Cloud Run deployment files, production runbook, and API integration tests from the public repo.

### Added

- `docs/ARCHITECTURE.md`
- `docs/COMMERCIAL_BOUNDARY.md`
- clearer README quickstart, architecture, and open-core sections

## [0.1.0] - 2026-05-01

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

[Unreleased]: https://github.com/Jayden-Siete/Limitrum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.0

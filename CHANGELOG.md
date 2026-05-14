# Changelog

All notable changes to Limitrum are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

No unreleased changes yet.

## [0.1.4] - 2026-05-14

### Added

- Local HTTP gateway endpoints in `@limitrum/mcp-server`: `/health`, `/v1/openapi.json`, and `POST /v1/verify-intent`.
- Optional gateway API-key enforcement through `LIMITRUM_GATEWAY_API_KEY`.
- `docs/HOSTED_GATEWAY.md` for the self-hostable verification API path.
- Unit tests for the gateway request handler.

### Changed

- `@limitrum/mcp-server` now serves MCP SSE and HTTP verification from the same local server.

## [0.1.3] - 2026-05-14

### Added

- `guardTool()` SDK helper for protecting app-owned tools before execution.
- Agent Tool Firewall demo covering app-owned tools, OpenAI-style tool calls, Claude-style tool use, Mistral function calls, LangChain-style tools, and shell execution blocks.
- `docs/AGENT_TOOL_FIREWALL.md` to document the product path and MCP gateway shape.
- Unit tests for `guardTool()`.

### Changed

- Protected tool-call example now uses `guardTool()` so blocked actions are not executed.
- MVP smoke test now includes the Agent Tool Firewall path.
- README and integration docs now position Limitrum as an agent tool-call firewall.

## [0.1.2] - 2026-05-04

### Added

- Mistral tool-call adapter for guarding Mistral function calls before execution.
- Mistral zero-cost example for a blocked unknown-domain tool call.
- `docs/REAL_WORLD_USE_CASES.md` to explain concrete SDK, OpenAI, Claude, Mistral, LangChain, and MCP use cases.

### Changed

- OpenAI, Anthropic, and LangChain adapters now extract tool targets from arguments such as `target`, `url`, `endpoint`, `domain`, `host`, and `apiUrl`.
- MVP smoke test now includes the Mistral tool-call path.

## [0.1.1] - 2026-05-02

### Added

- `docs/INTEGRATE_IN_5_MINUTES.md` for SDK, OpenAI adapter, and MCP integration paths.
- Protected tool-call example showing allowed and blocked verdicts.
- GitHub integration feedback issue template.

### Changed

- Updated package metadata for the official site.
- Prepared npm packages for `0.1.1`.

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

[Unreleased]: https://github.com/Jayden-Siete/Limitrum/compare/v0.1.4...HEAD
[0.1.4]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.4
[0.1.3]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.3
[0.1.2]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.2
[0.1.1]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.1
[0.1.0]: https://github.com/Jayden-Siete/Limitrum/releases/tag/v0.1.0

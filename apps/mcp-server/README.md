# @limitrum/mcp-server

MCP server and local HTTP gateway for Limitrum policy verification.

Use it as the guard step in an MCP gateway:

```text
MCP-compatible agent -> limitrum_guard -> sensitive tool
```

If the verdict is blocked, the sensitive tool should not be called.

```bash
pnpm add @limitrum/mcp-server
```

```bash
pnpm --filter @limitrum/mcp-server dev
```

SSE mode:

```bash
pnpm --filter @limitrum/mcp-server dev:sse
```

HTTP gateway mode is exposed by the same SSE server:

```bash
pnpm gateway:dev
```

Endpoints:

- `GET /health`
- `GET /v1/openapi.json`
- `POST /v1/verify-intent`
- `GET /sse`
- `POST /messages?sessionId=...`

Verify an intent:

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d '{"intent":{"agentId":"agent_sales_01","action":"fetch","target":"api.unknown-exfil.io","amount":1}}'
```

Set `LIMITRUM_GATEWAY_API_KEY` to require `X-Limitrum-API-Key` or `Authorization: Bearer ...`.

See the main repository README for the full MVP workflow.
See `docs/AGENT_TOOL_FIREWALL.md` for the product-level gateway pattern.
See `docs/HOSTED_GATEWAY.md` for the HTTP gateway path.

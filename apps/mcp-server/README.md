# @limitrum/mcp-server

MCP server that exposes Limitrum policy verification as a tool named `limitrum_guard`.

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

See the main repository README for the full MVP workflow.
See `docs/AGENT_TOOL_FIREWALL.md` for the product-level gateway pattern.

import { runSseTransport } from "./transports/sse.js";
import { runStdioTransport } from "./transports/stdio.js";

async function main() {
  const mode = process.env.MCP_TRANSPORT ?? "stdio";
  const port = Number(process.env.PORT ?? 8788);

  if (mode === "sse") {
    await runSseTransport(port);
    console.log(`Limitrum MCP server running on http://localhost:${port} (SSE mode)`);
    return;
  }

  await runStdioTransport();
  console.error("Limitrum MCP server connected via stdio.");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

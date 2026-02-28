import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLimitrumMcpServer } from "../server.js";

export async function runStdioTransport() {
  const server = createLimitrumMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

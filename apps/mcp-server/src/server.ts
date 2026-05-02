import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { limitrumGuardTool, runLimitrumGuardTool } from "./tools/limitrumGuardTool.js";

export function createLimitrumMcpServer() {
  const server = new Server(
    {
      name: "limitrum-mcp-server",
      version: "0.1.1",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [limitrumGuardTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== limitrumGuardTool.name) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    try {
      const result = await runLimitrumGuardTool(request.params.arguments);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown limitrum_guard failure";
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  });

  return server;
}

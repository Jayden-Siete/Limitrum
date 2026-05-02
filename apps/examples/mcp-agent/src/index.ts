import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFilePath);
  const mcpServerEntry = path.resolve(thisDir, "../../../mcp-server/src/index.ts");

  const transport = new StdioClientTransport({
    command: "tsx",
    args: [mcpServerEntry],
    env: {
      ...process.env,
      MCP_TRANSPORT: "stdio",
    },
  });

  const client = new Client(
    {
      name: "limitrum-mcp-agent-example",
      version: "0.1.1",
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);
  const tools = await client.listTools();
  console.log("MCP tools discovered:", tools.tools.map((tool) => tool.name).join(", "));

  const result = await client.callTool({
    name: "limitrum_guard",
    arguments: {
      agentId: "agent_sales_01",
      action: "tool:process_refund",
      target: "api.openai.com/v1/chat/completions",
      amount: 5000,
      estimatedCostUsd: 5000,
      metadata: {
        source: "example-mcp-agent",
        note: "zero-cost MCP simulation",
      },
    },
  });

  console.log("MCP tool result:");
  console.log(JSON.stringify(result, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error("MCP example failed:", error);
  process.exit(1);
});

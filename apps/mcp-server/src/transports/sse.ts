import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { handleGatewayRequest, type GatewayResponse } from "../http/gateway.js";
import { createLimitrumMcpServer } from "../server.js";

const maxGatewayBodyBytes = 1_000_000;

function sendGatewayResponse(res: ServerResponse, response: GatewayResponse) {
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}

async function readRequestBody(req: IncomingMessage) {
  let body = "";
  for await (const chunk of req) {
    body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    if (Buffer.byteLength(body) > maxGatewayBodyBytes) {
      throw new Error("Request body exceeds 1MB limit.");
    }
  }
  return body;
}

export async function runSseTransport(port: number) {
  const server = createLimitrumMcpServer();
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/v1/openapi.json" || url.pathname === "/v1/verify-intent") {
      try {
        const response = await handleGatewayRequest({
          method: req.method ?? "GET",
          pathname: url.pathname,
          headers: req.headers as Record<string, string | undefined>,
          body: req.method === "POST" ? await readRequestBody(req) : undefined,
        });

        if (response) {
          sendGatewayResponse(res, response);
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gateway request failed.";
        res.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "request_too_large", message }));
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/mcp/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, service: "limitrum-mcp-server", transport: "sse" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);
      res.on("close", () => {
        transports.delete(transport.sessionId);
      });
      await server.connect(transport);
      return;
    }

    if (req.method === "POST" && url.pathname === "/messages") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        res.writeHead(400);
        res.end("Missing sessionId");
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404);
        res.end("SSE transport session not found");
        return;
      }

      await transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port, resolve);
  });
}

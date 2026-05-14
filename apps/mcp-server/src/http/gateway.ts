import { LimitrumGuard, type VerifyIntentInput } from "@limitrum/sdk";

type HeaderMap = Record<string, string | undefined>;

export type GatewayRequest = {
  method: string;
  pathname: string;
  headers?: HeaderMap;
  body?: string;
};

export type GatewayResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type GatewayGuard = Pick<LimitrumGuard, "verify">;

export type GatewayOptions = {
  guard?: GatewayGuard;
  apiKey?: string;
  serviceName?: string;
  version?: string;
};

const defaultJsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status: number, payload: unknown): GatewayResponse {
  return {
    status,
    headers: defaultJsonHeaders,
    body: JSON.stringify(payload, null, 2),
  };
}

function normalizeHeaders(headers: HeaderMap | undefined): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (typeof value === "string") {
      normalized[key.toLowerCase()] = value;
    }
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

function isAuthorized(headers: Record<string, string>, expectedApiKey: string | undefined) {
  if (!expectedApiKey) return true;
  const headerKey = headers["x-limitrum-api-key"];
  const bearerKey = getBearerToken(headers.authorization);
  return headerKey === expectedApiKey || bearerKey === expectedApiKey;
}

function getOpenApiDocument(serviceName: string, version: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Limitrum Gateway API",
      version,
      description: "Hosted policy verification API for AI agent tool calls.",
    },
    servers: [{ url: "https://limitrum.com" }],
    paths: {
      "/health": {
        get: {
          summary: "Gateway health check",
          responses: { "200": { description: "Gateway is healthy" } },
        },
      },
      "/v1/verify-intent": {
        post: {
          summary: "Verify an agent intent before tool execution",
          security: [{ limitrumApiKey: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "object",
                      required: ["agentId", "action", "target"],
                      properties: {
                        agentId: { type: "string" },
                        action: { type: "string" },
                        target: { type: "string" },
                        amount: { type: "number" },
                        estimatedCostUsd: { type: "number" },
                        metadata: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Policy verdict" },
            "400": { description: "Invalid request" },
            "401": { description: "Missing or invalid API key" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        limitrumApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-Limitrum-API-Key",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    "x-limitrum": {
      serviceName,
      endpoints: ["/health", "/v1/verify-intent", "/v1/openapi.json", "/sse"],
    },
  };
}

export async function handleGatewayRequest(
  request: GatewayRequest,
  options: GatewayOptions = {},
): Promise<GatewayResponse | null> {
  const method = request.method.toUpperCase();
  const serviceName = options.serviceName ?? "limitrum-gateway";
  const version = options.version ?? "0.1.2";

  if (method === "GET" && request.pathname === "/") {
    return json(200, {
      ok: true,
      service: serviceName,
      version,
      endpoints: {
        health: "/health",
        verifyIntent: "/v1/verify-intent",
        openapi: "/v1/openapi.json",
        mcpSse: "/sse",
      },
    });
  }

  if (method === "GET" && request.pathname === "/health") {
    return json(200, {
      ok: true,
      service: serviceName,
      version,
      mode: "http+mcp-sse",
    });
  }

  if (method === "GET" && request.pathname === "/v1/openapi.json") {
    return json(200, getOpenApiDocument(serviceName, version));
  }

  if (request.pathname !== "/v1/verify-intent") {
    return null;
  }

  if (method !== "POST") {
    return json(405, {
      error: "method_not_allowed",
      message: "Use POST /v1/verify-intent.",
    });
  }

  const headers = normalizeHeaders(request.headers);
  const apiKey = options.apiKey ?? process.env.LIMITRUM_GATEWAY_API_KEY;
  if (!isAuthorized(headers, apiKey)) {
    return json(401, {
      error: "unauthorized",
      message: "Missing or invalid Limitrum API key.",
    });
  }

  let parsed: unknown;
  try {
    parsed = request.body ? JSON.parse(request.body) : {};
  } catch {
    return json(400, {
      error: "invalid_json",
      message: "Request body must be valid JSON.",
    });
  }

  const intent = isRecord(parsed) && isRecord(parsed.intent) ? parsed.intent : parsed;
  if (!isRecord(intent)) {
    return json(400, {
      error: "invalid_intent",
      message: "Body must be an intent object or { intent: ... }.",
    });
  }

  const guard = options.guard ?? new LimitrumGuard();

  try {
    const verdict = await guard.verify(intent as VerifyIntentInput);
    return json(200, {
      ...verdict,
      enforcedBy: "limitrum-policy-kernel",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid policy verification request.";
    return json(400, {
      error: "verification_failed",
      message,
    });
  }
}

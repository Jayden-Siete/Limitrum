import { describe, expect, it, vi } from "vitest";
import { handleGatewayRequest, type GatewayGuard } from "../../../apps/mcp-server/src/http/gateway";

function createGuard(decision: "allowed" | "blocked" = "allowed"): GatewayGuard {
  return {
    verify: vi.fn(async () => ({
      allowed: decision === "allowed",
      decision,
      reason: decision === "allowed" ? "Intent accepted." : "Domain not allowed.",
      guardTriggered: decision === "blocked" ? "domain-allowlist" : undefined,
      policyId: "policy_test",
      cumulativeSpent: 10,
      remainingBudget: 40,
      latencyMs: 3,
    })),
  };
}

describe("Limitrum gateway HTTP API", () => {
  it("returns health metadata", async () => {
    const response = await handleGatewayRequest({
      method: "GET",
      pathname: "/health",
    });

    expect(response?.status).toBe(200);
    expect(JSON.parse(response?.body ?? "{}")).toMatchObject({
      ok: true,
      service: "limitrum-gateway",
      mode: "http+mcp-sse",
    });
  });

  it("requires an API key when configured", async () => {
    const response = await handleGatewayRequest(
      {
        method: "POST",
        pathname: "/v1/verify-intent",
        body: JSON.stringify({
          intent: {
            agentId: "agent_test",
            action: "fetch",
            target: "https://api.stripe.com/v1/customers",
          },
        }),
      },
      {
        apiKey: "test_key",
        guard: createGuard(),
      },
    );

    expect(response?.status).toBe(401);
    expect(JSON.parse(response?.body ?? "{}")).toMatchObject({
      error: "unauthorized",
    });
  });

  it("verifies an intent with X-Limitrum-API-Key auth", async () => {
    const guard = createGuard("allowed");
    const response = await handleGatewayRequest(
      {
        method: "POST",
        pathname: "/v1/verify-intent",
        headers: {
          "x-limitrum-api-key": "test_key",
        },
        body: JSON.stringify({
          intent: {
            agentId: "agent_test",
            action: "stripe.createCharge",
            target: "https://api.stripe.com/v1/charges",
            amount: 25,
          },
        }),
      },
      {
        apiKey: "test_key",
        guard,
      },
    );

    expect(response?.status).toBe(200);
    expect(JSON.parse(response?.body ?? "{}")).toMatchObject({
      decision: "allowed",
      enforcedBy: "limitrum-policy-kernel",
    });
    expect(guard.verify).toHaveBeenCalledWith({
      agentId: "agent_test",
      action: "stripe.createCharge",
      target: "https://api.stripe.com/v1/charges",
      amount: 25,
    });
  });

  it("supports bearer auth and direct intent bodies", async () => {
    const response = await handleGatewayRequest(
      {
        method: "POST",
        pathname: "/v1/verify-intent",
        headers: {
          authorization: "Bearer test_key",
        },
        body: JSON.stringify({
          agentId: "agent_test",
          action: "fetch",
          target: "https://api.unknown-exfil.io/data",
        }),
      },
      {
        apiKey: "test_key",
        guard: createGuard("blocked"),
      },
    );

    expect(response?.status).toBe(200);
    expect(JSON.parse(response?.body ?? "{}")).toMatchObject({
      decision: "blocked",
      guardTriggered: "domain-allowlist",
    });
  });

  it("returns null for non-gateway paths", async () => {
    const response = await handleGatewayRequest({
      method: "GET",
      pathname: "/sse",
    });

    expect(response).toBeNull();
  });
});

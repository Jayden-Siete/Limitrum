import { describe, it, expect } from "vitest";

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const DEMO_KEY =
  process.env.DEMO_API_KEY ?? "lmt_demo_c6e6149d7aca04bb53202b0dd435acef";
const DEMO_AGENT_ID = "agent_sales_01";

function authHeaders(key = DEMO_KEY) {
  return {
    "Content-Type": "application/json",
    "X-Limitrum-API-Key": key,
  };
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function put(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function patch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("GET /v1/agents/:id/policy", () => {
  it("returns 200 for seeded agent", async () => {
    const { status } = await get(`/v1/agents/${DEMO_AGENT_ID}/policy`);
    expect(status).toBe(200);
  });

  it("returns 404 for non-existent agent", async () => {
    const { status } = await get("/v1/agents/agent_nonexistent_xyz/policy");
    expect(status).toBe(404);
  });

  it("returns policy with required fields", async () => {
    const { body } = await get(`/v1/agents/${DEMO_AGENT_ID}/policy`);
    const policy = body.policy as Record<string, unknown>;
    expect(typeof policy.id).toBe("string");
    expect(typeof policy.agentId).toBe("string");
    expect(typeof policy.maxDailySpend).toBe("number");
    expect(Array.isArray(policy.allowedEndpoints)).toBe(true);
    expect(typeof policy.guards).toBe("object");
  });
});

describe("PUT/PATCH /v1/agents/:id/policy", () => {
  it("returns 404 for non-existent agent", async () => {
    const { status } = await patch("/v1/agents/agent_nonexistent_xyz/policy", {
      maxDailySpend: 100,
    });
    expect(status).toBe(404);
  });

  it("updates maxDailySpend", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, {
      maxDailySpend: 75,
    });
    expect(status).toBe(200);
    expect((body.policy as Record<string, unknown>).maxDailySpend).toBe(75);
  });

  it("restores original maxDailySpend", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, {
      maxDailySpend: 50,
    });
    expect(status).toBe(200);
    expect((body.policy as Record<string, unknown>).maxDailySpend).toBe(50);
  });

  it("upserts full policy payload with PUT", async () => {
    const payload = {
      maxDailySpend: 50,
      perActionCap: 10,
      maxRatePerMinute: 20,
      allowedEndpoints: ["api.openai.com"],
      loopDetectionEnabled: true,
      loopDetectionMaxCount: 5,
      loopDetectionWindowSec: 10,
      syscallProtectionEnabled: true,
      destructiveActionsEnabled: true,
      dataExfilEnabled: true,
      promptInjectionEnabled: true,
      blockedPatterns: [],
    };

    const { status, body } = await put(`/v1/agents/${DEMO_AGENT_ID}/policy`, payload);
    expect([200, 201]).toContain(status);
    const policy = body.policy as Record<string, unknown>;
    expect(policy.maxDailySpend).toBe(50);
    expect(policy.maxRatePerMinute).toBe(20);
    expect((policy.guards as Record<string, unknown>).promptInjection).toBeTruthy();
  });
});

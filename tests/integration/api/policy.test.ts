import { describe, it, expect } from "vitest";

/**
 * Integration tests for /v1/agents/:id/policy routes
 *
 * Requires:
 *  - API server running on localhost:8000
 *  - DB seeded (pnpm --filter @limitrum/db seed)
 *  - Demo API key: lmt_demo_c6e6149d7aca04bb53202b0dd435acef
 */

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const DEMO_KEY = process.env.DEMO_API_KEY ?? "lmt_demo_c6e6149d7aca04bb53202b0dd435acef";
const DEMO_AGENT_ID = "agent_sales_01";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── GET /v1/agents/:id/policy ─────────────────────────────────────────────────

describe("GET /v1/agents/:id/policy", () => {
  it("returns 200 for seeded agent", async () => {
    const { status } = await get(`/v1/agents/${DEMO_AGENT_ID}/policy`);
    expect(status).toBe(200);
  });

  it("returns 404 for non-existent agent", async () => {
    const { status } = await get("/v1/agents/agent_nonexistent_xyz/policy");
    expect(status).toBe(404);
  });

  it("returns policy with all required fields", async () => {
    const { body } = await get(`/v1/agents/${DEMO_AGENT_ID}/policy`);
    expect(typeof body.id).toBe("string");
    expect(typeof body.agentId).toBe("string");
    expect(typeof body.maxDailySpend).toBe("number");
    expect(typeof body.allowedEndpoints).toBe("string");
    expect(typeof body.loopDetectionEnabled).toBe("number");
    expect(typeof body.syscallProtectionEnabled).toBe("number");
  });

  it("returns policy with guard fields", async () => {
    const { body } = await get(`/v1/agents/${DEMO_AGENT_ID}/policy`);
    expect(body).toHaveProperty("perActionCap");
    expect(body).toHaveProperty("maxRatePerMinute");
    expect(body).toHaveProperty("destructiveActionsEnabled");
    expect(body).toHaveProperty("dataExfilEnabled");
    expect(body).toHaveProperty("promptInjectionEnabled");
    expect(body).toHaveProperty("blockedPatterns");
  });
});

// ── PATCH /v1/agents/:id/policy ───────────────────────────────────────────────

describe("PATCH /v1/agents/:id/policy", () => {
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
    expect(body.maxDailySpend).toBe(75);
  });

  it("restores original maxDailySpend", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, {
      maxDailySpend: 50,
    });
    expect(status).toBe(200);
    expect(body.maxDailySpend).toBe(50);
  });

  it("updates loopDetectionEnabled flag", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, {
      loopDetectionEnabled: 0,
    });
    expect(status).toBe(200);
    expect(body.loopDetectionEnabled).toBe(0);
    // restore
    await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, { loopDetectionEnabled: 1 });
  });

  it("updates syscallProtectionEnabled flag", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, {
      syscallProtectionEnabled: 0,
    });
    expect(status).toBe(200);
    expect(body.syscallProtectionEnabled).toBe(0);
    // restore
    await patch(`/v1/agents/${DEMO_AGENT_ID}/policy`, { syscallProtectionEnabled: 1 });
  });
});

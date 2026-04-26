import { describe, it, expect } from "vitest";

/**
 * Integration tests for /v1/agents routes
 *
 * Requires:
 *  - API server running on localhost:8000
 *  - DB seeded with demo data (pnpm --filter @limitrum/db seed)
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

async function get(path: string, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(key) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function post(path: string, body: Record<string, unknown>, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(key),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function patch(path: string, body: Record<string, unknown>, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(key),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("GET /v1/agents - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/agents`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/agents", "lmt_invalid_key_xyz");
    expect(status).toBe(401);
  });

  it("returns 200 with valid API key", async () => {
    const { status } = await get("/v1/agents");
    expect(status).toBe(200);
  });
});

// ── GET /v1/agents ────────────────────────────────────────────────────────────

describe("GET /v1/agents", () => {
  it("returns an array of agents", async () => {
    const { body } = await get("/v1/agents");
    expect(Array.isArray(body.agents)).toBe(true);
  });

  it("includes the seeded demo agent", async () => {
    const { body } = await get("/v1/agents");
    const agents = body.agents as Array<Record<string, unknown>>;
    const demo = agents.find((a) => a.id === DEMO_AGENT_ID);
    expect(demo).toBeDefined();
  });

  it("each agent has id, name, status, environment fields", async () => {
    const { body } = await get("/v1/agents");
    const agents = body.agents as Array<Record<string, unknown>>;
    for (const agent of agents) {
      expect(typeof agent.id).toBe("string");
      expect(typeof agent.name).toBe("string");
      expect(typeof agent.status).toBe("string");
      expect(typeof agent.environment).toBe("string");
    }
  });
});

// ── GET /v1/agents/:id/status ─────────────────────────────────────────────────

describe("GET /v1/agents/:id/status", () => {
  it("returns 200 for existing agent", async () => {
    const { status } = await get(`/v1/agents/${DEMO_AGENT_ID}/status`);
    expect(status).toBe(200);
  });

  it("returns agent status fields", async () => {
    const { body } = await get(`/v1/agents/${DEMO_AGENT_ID}/status`);
    expect(typeof body.agentId).toBe("string");
    expect(typeof body.status).toBe("string");
  });

  it("returns 404 for non-existent agent", async () => {
    const { status } = await get("/v1/agents/agent_nonexistent_xyz/status");
    expect(status).toBe(404);
  });
});

// ── PATCH /v1/agents/:id ──────────────────────────────────────────────────────

describe("PATCH /v1/agents/:id", () => {
  it("returns 404 for non-existent agent", async () => {
    const { status } = await patch("/v1/agents/agent_nonexistent_xyz", { status: "paused" });
    expect(status).toBe(404);
  });

  it("updates agent status to paused", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}`, { status: "paused" });
    expect(status).toBe(200);
    expect((body.agent as Record<string, unknown>).status).toBe("paused");
  });

  it("updates agent status back to active", async () => {
    const { status, body } = await patch(`/v1/agents/${DEMO_AGENT_ID}`, { status: "active" });
    expect(status).toBe(200);
    expect((body.agent as Record<string, unknown>).status).toBe("active");
  });
});

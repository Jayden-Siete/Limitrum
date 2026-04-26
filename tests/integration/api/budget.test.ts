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

async function get(path: string, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(key) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("GET /v1/budget/report - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/budget/report`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/budget/report", "lmt_invalid_key");
    expect(status).toBe(401);
  });
});

describe("GET /v1/budget/report", () => {
  it("returns report array", async () => {
    const { body } = await get("/v1/budget/report");
    expect(Array.isArray(body.report)).toBe(true);
    expect(typeof body.summary).toBe("object");
  });

  it("report entries include spend and budget shapes", async () => {
    const { body } = await get("/v1/budget/report");
    const report = body.report as Array<Record<string, unknown>>;
    for (const entry of report) {
      expect(typeof entry.agentId).toBe("string");
      expect(typeof entry.spend).toBe("object");
      expect(typeof entry.budget).toBe("object");
    }
  });
});

describe("GET /v1/budget/report/:agentId", () => {
  it("returns 200 for seeded agent", async () => {
    const { status } = await get(`/v1/budget/report/${DEMO_AGENT_ID}`);
    expect(status).toBe(200);
  });

  it("returns 404 for non-existent agent", async () => {
    const { status } = await get("/v1/budget/report/agent_nonexistent_xyz");
    expect(status).toBe(404);
  });

  it("returns single agent budget details", async () => {
    const { body } = await get(`/v1/budget/report/${DEMO_AGENT_ID}`);
    expect(body.agentId).toBe(DEMO_AGENT_ID);
    expect(typeof body.today).toBe("object");
    expect(typeof (body.today as Record<string, unknown>).spent).toBe("number");
    expect(typeof (body.today as Record<string, unknown>).remaining).toBe("number");
  });
});

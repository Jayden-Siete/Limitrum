import { describe, it, expect } from "vitest";

/**
 * Integration tests for /v1/budget routes
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

async function get(path: string, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(key) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("GET /v1/budget/report - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/budget/report`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/budget/report", "lmt_invalid_key");
    expect(status).toBe(401);
  });

  it("returns 200 with valid API key", async () => {
    const { status } = await get("/v1/budget/report");
    expect(status).toBe(200);
  });
});

// ── GET /v1/budget/report ─────────────────────────────────────────────────────

describe("GET /v1/budget/report", () => {
  it("returns an array of agent budget summaries", async () => {
    const { body } = await get("/v1/budget/report");
    expect(Array.isArray(body.report)).toBe(true);
  });

  it("each report entry has required fields", async () => {
    const { body } = await get("/v1/budget/report");
    const report = body.report as Array<Record<string, unknown>>;
    for (const entry of report) {
      expect(typeof entry.agentId).toBe("string");
      expect(typeof entry.maxDailySpend).toBe("number");
      expect(typeof entry.cumulativeSpent).toBe("number");
      expect(typeof entry.remainingBudget).toBe("number");
      expect(typeof entry.utilizationPct).toBe("number");
    }
  });

  it("utilizationPct is between 0 and 100", async () => {
    const { body } = await get("/v1/budget/report");
    const report = body.report as Array<Record<string, unknown>>;
    for (const entry of report) {
      expect(entry.utilizationPct as number).toBeGreaterThanOrEqual(0);
      expect(entry.utilizationPct as number).toBeLessThanOrEqual(100);
    }
  });

  it("remainingBudget is non-negative", async () => {
    const { body } = await get("/v1/budget/report");
    const report = body.report as Array<Record<string, unknown>>;
    for (const entry of report) {
      expect(entry.remainingBudget as number).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes topGuardsTriggered field", async () => {
    const { body } = await get("/v1/budget/report");
    const report = body.report as Array<Record<string, unknown>>;
    for (const entry of report) {
      expect(entry).toHaveProperty("topGuardsTriggered");
    }
  });
});

// ── GET /v1/budget/report/:agentId ───────────────────────────────────────────

describe("GET /v1/budget/report/:agentId", () => {
  it("returns 200 for seeded agent", async () => {
    const { status } = await get(`/v1/budget/report/${DEMO_AGENT_ID}`);
    expect(status).toBe(200);
  });

  it("returns 404 for non-existent agent", async () => {
    const { status } = await get("/v1/budget/report/agent_nonexistent_xyz");
    expect(status).toBe(404);
  });

  it("returns single agent budget report with correct agentId", async () => {
    const { body } = await get(`/v1/budget/report/${DEMO_AGENT_ID}`);
    expect(body.agentId).toBe(DEMO_AGENT_ID);
    expect(typeof body.maxDailySpend).toBe("number");
    expect(typeof body.cumulativeSpent).toBe("number");
    expect(typeof body.remainingBudget).toBe("number");
    expect(typeof body.utilizationPct).toBe("number");
  });

  it("cumulativeSpent + remainingBudget equals maxDailySpend", async () => {
    const { body } = await get(`/v1/budget/report/${DEMO_AGENT_ID}`);
    const spent = body.cumulativeSpent as number;
    const remaining = body.remainingBudget as number;
    const max = body.maxDailySpend as number;
    // Allow small floating point tolerance
    expect(Math.abs(spent + remaining - max)).toBeLessThan(0.001);
  });
});

import { describe, it, expect } from "vitest";

/**
 * Integration tests for /v1/logs routes
 *
 * Requires:
 *  - API server running on localhost:8000
 *  - DB seeded (pnpm --filter @limitrum/db seed)
 *  - At least one verify-intent call made (to generate logs)
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

async function seedLog(decision: "allowed" | "blocked" = "allowed") {
  const target = decision === "allowed" ? "api.stripe.com" : "evil.com";
  await fetch(`${BASE_URL}/v1/verify-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: DEMO_AGENT_ID,
      action: "http:GET",
      target,
      amount: 0.01,
    }),
  });
}

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("GET /v1/logs - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/logs`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/logs", "lmt_invalid_key");
    expect(status).toBe(401);
  });

  it("returns 200 with valid API key", async () => {
    const { status } = await get("/v1/logs");
    expect(status).toBe(200);
  });
});

// ── GET /v1/logs ──────────────────────────────────────────────────────────────

describe("GET /v1/logs", () => {
  it("returns logs array and pagination meta", async () => {
    const { body } = await get("/v1/logs");
    expect(Array.isArray(body.logs)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(typeof body.page).toBe("number");
    expect(typeof body.pageSize).toBe("number");
  });

  it("each log has required fields", async () => {
    await seedLog("allowed");
    const { body } = await get("/v1/logs");
    const logs = body.logs as Array<Record<string, unknown>>;
    if (logs.length > 0) {
      const log = logs[0]!;
      expect(typeof log.id).toBe("string");
      expect(typeof log.agentId).toBe("string");
      expect(typeof log.action).toBe("string");
      expect(typeof log.target).toBe("string");
      expect(["allowed", "blocked"]).toContain(log.decision);
      expect(typeof log.reason).toBe("string");
      expect(typeof log.createdAt).toBe("number");
    }
  });

  it("supports agentId filter", async () => {
    await seedLog("allowed");
    const { body } = await get(`/v1/logs?agentId=${DEMO_AGENT_ID}`);
    const logs = body.logs as Array<Record<string, unknown>>;
    for (const log of logs) {
      expect(log.agentId).toBe(DEMO_AGENT_ID);
    }
  });

  it("supports decision filter - allowed", async () => {
    await seedLog("allowed");
    const { body } = await get("/v1/logs?decision=allowed");
    const logs = body.logs as Array<Record<string, unknown>>;
    for (const log of logs) {
      expect(log.decision).toBe("allowed");
    }
  });

  it("supports decision filter - blocked", async () => {
    await seedLog("blocked");
    const { body } = await get("/v1/logs?decision=blocked");
    const logs = body.logs as Array<Record<string, unknown>>;
    for (const log of logs) {
      expect(log.decision).toBe("blocked");
    }
  });

  it("supports page and pageSize query params", async () => {
    const { body } = await get("/v1/logs?page=1&pageSize=5");
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
    const logs = body.logs as Array<unknown>;
    expect(logs.length).toBeLessThanOrEqual(5);
  });

  it("returns guardTriggered field on each log", async () => {
    await seedLog("blocked");
    const { body } = await get("/v1/logs?decision=blocked&pageSize=1");
    const logs = body.logs as Array<Record<string, unknown>>;
    if (logs.length > 0) {
      expect(logs[0]).toHaveProperty("guardTriggered");
    }
  });
});

// ── GET /v1/logs/:id ──────────────────────────────────────────────────────────

describe("GET /v1/logs/:id", () => {
  it("returns 404 for non-existent log id", async () => {
    const { status } = await get("/v1/logs/log_nonexistent_xyz");
    expect(status).toBe(404);
  });

  it("returns a single log by id", async () => {
    await seedLog("allowed");
    const listRes = await get(`/v1/logs?agentId=${DEMO_AGENT_ID}&pageSize=1`);
    const logs = listRes.body.logs as Array<Record<string, unknown>>;
    if (logs.length > 0) {
      const logId = logs[0]!.id as string;
      const { status, body } = await get(`/v1/logs/${logId}`);
      expect(status).toBe(200);
      expect(body.id).toBe(logId);
    }
  });
});

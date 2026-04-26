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

async function seedLog(decision: "allowed" | "blocked" = "allowed") {
  const target = decision === "allowed" ? "api.stripe.com" : "evil.com";
  await fetch(`${BASE_URL}/v1/verify-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: {
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target,
        amount: 0.01,
      },
    }),
  });
}

describe("GET /v1/logs - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/logs`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/logs", "lmt_invalid_key");
    expect(status).toBe(401);
  });
});

describe("GET /v1/logs", () => {
  it("returns logs array and pagination metadata", async () => {
    const { body } = await get("/v1/logs");
    expect(Array.isArray(body.logs)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(typeof body.limit).toBe("number");
    expect(typeof body.offset).toBe("number");
  });

  it("supports agentId filter", async () => {
    await seedLog("allowed");
    const { body } = await get(`/v1/logs?agentId=${DEMO_AGENT_ID}`);
    const logs = body.logs as Array<Record<string, unknown>>;
    for (const log of logs) {
      expect(log.agentId).toBe(DEMO_AGENT_ID);
    }
  });

  it("supports decision filter", async () => {
    await seedLog("blocked");
    const { body } = await get("/v1/logs?decision=blocked&limit=20&offset=0");
    const logs = body.logs as Array<Record<string, unknown>>;
    for (const log of logs) {
      expect(log.decision).toBe("blocked");
    }
  });

  it("returns guardTriggered field on each log", async () => {
    const { body } = await get("/v1/logs?decision=blocked&limit=1");
    const logs = body.logs as Array<Record<string, unknown>>;
    if (logs.length > 0) {
      expect(logs[0]).toHaveProperty("guardTriggered");
    }
  });
});

describe("GET /v1/logs/:id", () => {
  it("returns 404 for non-existent log id", async () => {
    const { status } = await get("/v1/logs/log_nonexistent_xyz");
    expect(status).toBe(404);
  });

  it("returns a single log by id", async () => {
    await seedLog("allowed");
    const listRes = await get(`/v1/logs?agentId=${DEMO_AGENT_ID}&limit=1`);
    const logs = listRes.body.logs as Array<Record<string, unknown>>;
    if (logs.length > 0) {
      const logId = logs[0].id as string;
      const { status, body } = await get(`/v1/logs/${logId}`);
      expect(status).toBe(200);
      expect((body.log as Record<string, unknown>).id).toBe(logId);
    }
  });
});

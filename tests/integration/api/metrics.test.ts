import { describe, it, expect } from "vitest";

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const DEMO_KEY =
  process.env.DEMO_API_KEY ?? "lmt_demo_c6e6149d7aca04bb53202b0dd435acef";

function authHeaders(key = DEMO_KEY) {
  return {
    "Content-Type": "application/json",
    "X-Limitrum-API-Key": key,
  };
}

async function getMetrics(path = "/v1/metrics", key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(key) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("GET /v1/metrics - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/metrics`);
    expect(res.status).toBe(401);
  });
});

describe("GET /v1/metrics", () => {
  it("returns organization metrics", async () => {
    const { status, body } = await getMetrics();
    expect(status).toBe(200);
    expect(typeof body.organizationId).toBe("string");
    expect(typeof body.generatedAt).toBe("number");
    expect(body.totals).toBeTypeOf("object");
    expect(Array.isArray(body.topGuardsTriggered)).toBe(true);
  });

  it("supports a 1h metrics window", async () => {
    const { status, body } = await getMetrics("/v1/metrics?window=1h");
    expect(status).toBe(200);
    expect(body.window).toBe("1h");
  });
});

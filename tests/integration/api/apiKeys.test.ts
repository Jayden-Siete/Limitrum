import { describe, it, expect } from "vitest";

/**
 * Integration tests for /v1/api-keys routes
 *
 * Requires:
 *  - API server running on localhost:8000
 *  - DB seeded (pnpm --filter @limitrum/db seed)
 *  - Demo API key: lmt_demo_c6e6149d7aca04bb53202b0dd435acef
 *  - Master key set via LIMITRUM_MASTER_KEY env var (or default "limitrum-master-dev")
 */

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const DEMO_KEY = process.env.DEMO_API_KEY ?? "lmt_demo_c6e6149d7aca04bb53202b0dd435acef";
const MASTER_KEY = process.env.LIMITRUM_MASTER_KEY ?? "limitrum-master-dev";
const DEMO_ORG_ID = "org_limitrum_demo";

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    "X-Limitrum-API-Key": key,
  };
}

async function get(path: string, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(key) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function post(path: string, body: Record<string, unknown>, key = MASTER_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(key),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function del(path: string, key = MASTER_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(key),
  });
  return { status: res.status, body: res.status === 204 ? null : ((await res.json()) as Record<string, unknown>) };
}

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("GET /v1/api-keys - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/api-keys`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid API key", async () => {
    const { status } = await get("/v1/api-keys", "lmt_invalid_key");
    expect(status).toBe(401);
  });

  it("returns 200 with valid API key", async () => {
    const { status } = await get("/v1/api-keys");
    expect(status).toBe(200);
  });
});

// ── GET /v1/api-keys ──────────────────────────────────────────────────────────

describe("GET /v1/api-keys", () => {
  it("returns an array of API keys", async () => {
    const { body } = await get("/v1/api-keys");
    expect(Array.isArray(body.keys)).toBe(true);
  });

  it("each key entry has id, label, organizationId, createdAt", async () => {
    const { body } = await get("/v1/api-keys");
    const keys = body.keys as Array<Record<string, unknown>>;
    for (const key of keys) {
      expect(typeof key.id).toBe("string");
      expect(typeof key.label).toBe("string");
      expect(typeof key.organizationId).toBe("string");
      expect(typeof key.createdAt).toBe("number");
    }
  });

  it("does NOT expose keyHash in response", async () => {
    const { body } = await get("/v1/api-keys");
    const keys = body.keys as Array<Record<string, unknown>>;
    for (const key of keys) {
      expect(key).not.toHaveProperty("keyHash");
    }
  });

  it("includes the seeded demo key", async () => {
    const { body } = await get("/v1/api-keys");
    const keys = body.keys as Array<Record<string, unknown>>;
    const demo = keys.find((k) => k.label === "Demo Key");
    expect(demo).toBeDefined();
  });
});

// ── POST /v1/api-keys ─────────────────────────────────────────────────────────

describe("POST /v1/api-keys", () => {
  let createdKeyId: string | null = null;
  let createdKeyPlaintext: string | null = null;

  it("returns 400 when organizationId is missing", async () => {
    const { status } = await post("/v1/api-keys", { label: "Test Key" });
    expect(status).toBe(400);
  });

  it("returns 400 when label is missing", async () => {
    const { status } = await post("/v1/api-keys", { organizationId: DEMO_ORG_ID });
    expect(status).toBe(400);
  });

  it("creates a new API key and returns plaintext key once", async () => {
    const { status, body } = await post("/v1/api-keys", {
      organizationId: DEMO_ORG_ID,
      label: "Integration Test Key",
    });
    expect(status).toBe(201);
    expect(typeof body.id).toBe("string");
    expect(typeof body.key).toBe("string");
    expect((body.key as string).startsWith("lmt_")).toBe(true);
    expect(typeof body.label).toBe("string");
    createdKeyId = body.id as string;
    createdKeyPlaintext = body.key as string;
  });

  it("new key can authenticate against the API", async () => {
    if (!createdKeyPlaintext) return;
    const { status } = await get("/v1/api-keys", createdKeyPlaintext);
    expect(status).toBe(200);
  });

  it("does NOT return keyHash in creation response", async () => {
    const { body } = await post("/v1/api-keys", {
      organizationId: DEMO_ORG_ID,
      label: "Integration Test Key 2",
    });
    expect(body).not.toHaveProperty("keyHash");
    // cleanup
    if (body.id) {
      await del(`/v1/api-keys/${body.id as string}`);
    }
  });

  // Cleanup
  it("deletes the created test key", async () => {
    if (!createdKeyId) return;
    const { status } = await del(`/v1/api-keys/${createdKeyId}`);
    expect([200, 204]).toContain(status);
    createdKeyId = null;
  });
});

// ── DELETE /v1/api-keys/:id ───────────────────────────────────────────────────

describe("DELETE /v1/api-keys/:id", () => {
  it("returns 404 for non-existent key id", async () => {
    const { status } = await del("/v1/api-keys/key_nonexistent_xyz");
    expect(status).toBe(404);
  });
});

import { describe, it, expect } from "vitest";

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const DEMO_KEY =
  process.env.DEMO_API_KEY ?? "lmt_demo_c6e6149d7aca04bb53202b0dd435acef";
const MASTER_KEY =
  process.env.LIMITRUM_MASTER_API_KEY ??
  process.env.LIMITRUM_MASTER_KEY ??
  "limitrum-master-dev";

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

async function postNoBody(path: string, key = DEMO_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(key),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function del(path: string, key = MASTER_KEY) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(key),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("GET /v1/api-keys - auth", () => {
  it("returns 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/v1/api-keys`);
    expect(res.status).toBe(401);
  });
});

describe("GET /v1/api-keys", () => {
  it("returns an array of API keys", async () => {
    const { body } = await get("/v1/api-keys");
    expect(Array.isArray(body.apiKeys)).toBe(true);
  });

  it("does not expose key hashes", async () => {
    const { body } = await get("/v1/api-keys");
    const keys = body.apiKeys as Array<Record<string, unknown>>;
    for (const key of keys) {
      expect(key).not.toHaveProperty("keyHash");
    }
  });
});

describe("POST /v1/api-keys", () => {
  let createdKeyId: string | null = null;
  let createdKeyPlaintext: string | null = null;

  it("creates a key with only label", async () => {
    const { status, body } = await post("/v1/api-keys", {
      label: "Integration Test Key",
    }, DEMO_KEY);
    expect(status).toBe(201);
    expect(typeof body.id).toBe("string");
    expect(typeof body.key).toBe("string");
    expect(body.revokedAt).toBeUndefined();
    createdKeyId = body.id as string;
    createdKeyPlaintext = body.key as string;
  });

  it("new key can authenticate", async () => {
    if (!createdKeyPlaintext) return;
    const { status } = await get("/v1/api-keys", createdKeyPlaintext);
    expect(status).toBe(200);
  });

  it("rotates the created key and invalidates the old plaintext", async () => {
    if (!createdKeyId || !createdKeyPlaintext) return;
    const oldKey = createdKeyPlaintext;
    const { status, body } = await postNoBody(`/v1/api-keys/${createdKeyId}/rotate`);
    expect(status).toBe(200);
    expect(typeof body.key).toBe("string");
    expect(body.key).not.toBe(oldKey);
    createdKeyPlaintext = body.key as string;

    const oldAuth = await get("/v1/api-keys", oldKey);
    expect(oldAuth.status).toBe(401);

    const newAuth = await get("/v1/api-keys", createdKeyPlaintext);
    expect(newAuth.status).toBe(200);
  });

  it("revokes the created key", async () => {
    if (!createdKeyId || !createdKeyPlaintext) return;
    const { status, body } = await postNoBody(`/v1/api-keys/${createdKeyId}/revoke`);
    expect(status).toBe(200);
    expect(body.revoked).toBe(true);

    const revokedAuth = await get("/v1/api-keys", createdKeyPlaintext);
    expect(revokedAuth.status).toBe(401);
  });

  it("deletes the created key", async () => {
    if (!createdKeyId) return;
    const { status } = await del(`/v1/api-keys/${createdKeyId}`, DEMO_KEY);
    expect(status).toBe(200);
  });
});

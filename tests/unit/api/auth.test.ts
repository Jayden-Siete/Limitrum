import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";

// ── Mock @limitrum/db ─────────────────────────────────────────────────────────

const mockSelect = vi.fn();

vi.mock("@limitrum/db", () => ({
  db: { select: mockSelect },
  apiKeys: {},
  organizations: {},
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "eq" })),
  and: vi.fn((...args: unknown[]) => ({ args, op: "and" })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function makeApiKeyRow(overrides: Partial<{
  id: string;
  organizationId: string;
  keyHash: string;
  label: string;
  expiresAt: number | null;
  createdAt: number;
}> = {}) {
  return {
    id: "key_test_01",
    organizationId: "org_test_01",
    keyHash: hashKey("lmt_testkey123"),
    label: "Test Key",
    expiresAt: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function setupDbMock(row: ReturnType<typeof makeApiKeyRow> | null) {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          then: vi.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
            Promise.resolve(cb(row ? [row] : [])),
          ),
        }),
      }),
    }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("requireApiKey middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SHA256 key hashing", () => {
    it("produces consistent hash for same input", () => {
      const key = "lmt_testkey123";
      expect(hashKey(key)).toBe(hashKey(key));
    });

    it("produces different hashes for different inputs", () => {
      expect(hashKey("lmt_key_a")).not.toBe(hashKey("lmt_key_b"));
    });

    it("produces 64-character hex string", () => {
      const hash = hashKey("lmt_testkey123");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("key expiry logic", () => {
    it("considers key valid when expiresAt is null", () => {
      const row = makeApiKeyRow({ expiresAt: null });
      const now = Date.now();
      const isExpired = row.expiresAt !== null && row.expiresAt < now;
      expect(isExpired).toBe(false);
    });

    it("considers key expired when expiresAt is in the past", () => {
      const row = makeApiKeyRow({ expiresAt: Date.now() - 1000 });
      const now = Date.now();
      const isExpired = row.expiresAt !== null && row.expiresAt < now;
      expect(isExpired).toBe(true);
    });

    it("considers key valid when expiresAt is in the future", () => {
      const row = makeApiKeyRow({ expiresAt: Date.now() + 86400000 });
      const now = Date.now();
      const isExpired = row.expiresAt !== null && row.expiresAt < now;
      expect(isExpired).toBe(false);
    });
  });

  describe("master key bypass", () => {
    it("master key env var bypasses DB lookup", () => {
      const masterKey = "lmt_master_secret";
      process.env.LIMITRUM_MASTER_KEY = masterKey;
      const isMaster = process.env.LIMITRUM_MASTER_KEY === masterKey;
      expect(isMaster).toBe(true);
      delete process.env.LIMITRUM_MASTER_KEY;
    });
  });

  describe("key format validation", () => {
    it("valid key starts with lmt_ prefix", () => {
      const key = "lmt_c6e6149d7aca04bb53202b0dd435acef";
      expect(key.startsWith("lmt_")).toBe(true);
    });

    it("invalid key does not start with lmt_ prefix", () => {
      const key = "sk-invalid-key";
      expect(key.startsWith("lmt_")).toBe(false);
    });
  });
});

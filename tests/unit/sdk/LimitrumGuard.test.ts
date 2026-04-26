import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockPolicy, makeMockIntent } from "./helpers.js";

// ── Mock @limitrum/db before importing LimitrumGuard ─────────────────────────

const { mockInsert, mockSelect } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  mockSelect: vi.fn(),
}));

vi.mock("@limitrum/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
  policies: {},
  agents: {},
  intentLogs: {},
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "eq" })),
  and: vi.fn((...args: unknown[]) => ({ args, op: "and" })),
  gte: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "gte" })),
  sql: vi.fn(),
}));

import { LimitrumGuard } from "@limitrum/sdk";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDbMocks(policy: ReturnType<typeof makeMockPolicy> | null, cumulativeSpent = 0) {
  mockSelect.mockImplementation(() => {
    let callCount = 0;
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            then: vi.fn().mockImplementation((cb: (rows: unknown[]) => unknown) => {
              callCount++;
              if (callCount === 1) {
                // First call: policy lookup
                return Promise.resolve(cb(policy ? [policy] : []));
              }
              // Second call: aggregate
              return Promise.resolve(cb([{ total: cumulativeSpent }]));
            }),
          }),
          then: vi.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
            Promise.resolve(cb([{ total: cumulativeSpent }])),
          ),
        }),
      }),
    };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LimitrumGuard", () => {
  let guard: LimitrumGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new LimitrumGuard();
  });

  // ── No policy ───────────────────────────────────────────────────────────────

  describe("no policy found", () => {
    it("blocks intent when no policy exists for agent", async () => {
      setupDbMocks(null);
      const result = await guard.verify(makeMockIntent());
      expect(result.allowed).toBe(false);
      expect(result.decision).toBe("blocked");
      expect(result.reason).toContain("No policy found");
    });

    it("returns zero budget when no policy exists", async () => {
      setupDbMocks(null);
      const result = await guard.verify(makeMockIntent());
      expect(result.cumulativeSpent).toBe(0);
      expect(result.remainingBudget).toBe(0);
    });
  });

  // ── Domain allowlist guard ──────────────────────────────────────────────────

  describe("domain-allowlist guard", () => {
    it("allows intent when target domain is in allowlist", async () => {
      const policy = makeMockPolicy({
        allowedEndpoints: JSON.stringify(["api.openai.com"]),
      });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ target: "api.openai.com" }));
      expect(result.allowed).toBe(true);
      expect(result.decision).toBe("allowed");
    });

    it("blocks intent when target domain is NOT in allowlist", async () => {
      const policy = makeMockPolicy({
        allowedEndpoints: JSON.stringify(["api.openai.com"]),
      });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ target: "evil.com" }));
      expect(result.allowed).toBe(false);
      expect(result.decision).toBe("blocked");
      expect(result.guardTriggered).toBe("domain-allowlist");
    });

    it("normalizes target URL to hostname before checking allowlist", async () => {
      const policy = makeMockPolicy({
        allowedEndpoints: JSON.stringify(["api.openai.com"]),
      });
      setupDbMocks(policy);
      const result = await guard.verify(
        makeMockIntent({ target: "https://api.openai.com/v1/chat/completions" }),
      );
      expect(result.allowed).toBe(true);
    });

    it("blocks when allowlist is empty", async () => {
      const policy = makeMockPolicy({ allowedEndpoints: "[]" });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ target: "api.openai.com" }));
      expect(result.allowed).toBe(false);
      expect(result.guardTriggered).toBe("data-exfil");
    });
  });

  // ── Budget daily guard ──────────────────────────────────────────────────────

  describe("budget-daily guard", () => {
    it("allows intent when cumulative spend is within budget", async () => {
      const policy = makeMockPolicy({ maxDailySpend: 100 });
      setupDbMocks(policy, 50);
      const result = await guard.verify(makeMockIntent({ amount: 10 }));
      expect(result.allowed).toBe(true);
      expect(result.cumulativeSpent).toBe(50);
    });

    it("blocks intent when cumulative spend would exceed daily budget", async () => {
      const policy = makeMockPolicy({ maxDailySpend: 100 });
      setupDbMocks(policy, 95);
      const result = await guard.verify(makeMockIntent({ amount: 10 }));
      expect(result.allowed).toBe(false);
      expect(result.guardTriggered).toBe("budget-daily");
      expect(result.reason).toContain("Daily budget exceeded");
    });

    it("returns correct remainingBudget", async () => {
      const policy = makeMockPolicy({ maxDailySpend: 100 });
      setupDbMocks(policy, 60);
      const result = await guard.verify(makeMockIntent({ amount: 5 }));
      expect(result.remainingBudget).toBe(40);
    });
  });

  // ── Per-action cap guard ────────────────────────────────────────────────────

  describe("budget-per-action guard", () => {
    it("allows intent when amount is within per-action cap", async () => {
      const policy = makeMockPolicy({ perActionCap: 10 });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ amount: 5 }));
      expect(result.allowed).toBe(true);
    });

    it("blocks intent when amount exceeds per-action cap", async () => {
      const policy = makeMockPolicy({ perActionCap: 5 });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ amount: 10 }));
      expect(result.allowed).toBe(false);
      expect(result.guardTriggered).toBe("budget-per-action");
    });

    it("skips per-action cap check when perActionCap is 0 (unlimited)", async () => {
      const policy = makeMockPolicy({ perActionCap: 0 });
      setupDbMocks(policy);
      const result = await guard.verify(makeMockIntent({ amount: 9999 }));
      // Should not be blocked by per-action cap (may be blocked by other guards)
      expect(result.guardTriggered).not.toBe("budget-per-action");
    });
  });

  // ── Syscall protection guard ────────────────────────────────────────────────

  describe("syscall-protection guard", () => {
    it("blocks syscall actions when protection is enabled", async () => {
      const policy = makeMockPolicy({ syscallProtectionEnabled: 1 });
      setupDbMocks(policy);
      const result = await guard.verify(
        makeMockIntent({ action: "exec_command", target: "api.openai.com" }),
      );
      expect(result.allowed).toBe(false);
      expect(result.guardTriggered).toBe("syscall-protection");
    });

    it("allows syscall actions when protection is disabled", async () => {
      const policy = makeMockPolicy({ syscallProtectionEnabled: 0 });
      setupDbMocks(policy);
      const result = await guard.verify(
        makeMockIntent({ action: "syscall:exec", target: "api.openai.com" }),
      );
      expect(result.guardTriggered).not.toBe("syscall-protection");
    });
  });

  // ── Input validation ────────────────────────────────────────────────────────

  describe("input validation", () => {
    it("throws ZodError when agentId is empty", async () => {
      await expect(guard.verify(makeMockIntent({ agentId: "" }))).rejects.toThrow();
    });

    it("throws ZodError when action is empty", async () => {
      await expect(guard.verify(makeMockIntent({ action: "" }))).rejects.toThrow();
    });

    it("throws ZodError when target is empty", async () => {
      await expect(guard.verify(makeMockIntent({ target: "" }))).rejects.toThrow();
    });

    it("throws ZodError when amount is negative", async () => {
      await expect(guard.verify(makeMockIntent({ amount: -1 }))).rejects.toThrow();
    });
  });
});

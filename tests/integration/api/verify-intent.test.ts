import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Integration tests for POST /v1/verify-intent
 *
 * These tests hit the real Hono API server running on localhost:8000.
 * They require the DB to be seeded with the demo agent/policy.
 *
 * Run: pnpm --filter @limitrum/tests test:integration
 */

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";

// Demo data seeded by packages/db/src/seed.ts
const DEMO_AGENT_ID = "agent_sales_01";
const ALLOWED_DOMAIN = "api.stripe.com";
const BLOCKED_DOMAIN = "evil.com";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function verifyIntent(body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/v1/verify-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

// ── Health check ──────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200 with ok:true", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("limitrum-api");
  });
});

// ── POST /v1/verify-intent ────────────────────────────────────────────────────

describe("POST /v1/verify-intent", () => {
  describe("input validation", () => {
    it("returns 400 when body is empty", async () => {
      const { status } = await verifyIntent({});
      expect(status).toBe(400);
    });

    it("returns 400 when agentId is missing", async () => {
      const { status } = await verifyIntent({
        action: "http:GET",
        target: ALLOWED_DOMAIN,
      });
      expect(status).toBe(400);
    });

    it("returns 400 when action is missing", async () => {
      const { status } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        target: ALLOWED_DOMAIN,
      });
      expect(status).toBe(400);
    });

    it("returns 400 when target is missing", async () => {
      const { status } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
      });
      expect(status).toBe(400);
    });

    it("returns 400 when amount is negative", async () => {
      const { status } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: ALLOWED_DOMAIN,
        amount: -1,
      });
      expect(status).toBe(400);
    });
  });

  describe("policy enforcement - allowed", () => {
    it("allows intent on allowlisted domain within budget", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:POST",
        target: ALLOWED_DOMAIN,
        amount: 0.01,
      });
      expect(status).toBe(200);
      expect(body.decision).toBe("allowed");
      expect(body.allowed).toBe(true);
      expect(typeof body.cumulativeSpent).toBe("number");
      expect(typeof body.remainingBudget).toBe("number");
    });

    it("returns guardTriggered as null when allowed", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: ALLOWED_DOMAIN,
        amount: 0,
      });
      expect(status).toBe(200);
      expect(body.guardTriggered).toBeNull();
    });

    it("returns policyId in response when allowed", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: ALLOWED_DOMAIN,
      });
      expect(status).toBe(200);
      expect(typeof body.policyId).toBe("string");
      expect((body.policyId as string).length).toBeGreaterThan(0);
    });
  });

  describe("policy enforcement - blocked", () => {
    it("blocks intent on non-allowlisted domain", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: BLOCKED_DOMAIN,
        amount: 0.01,
      });
      expect(status).toBe(200);
      expect(body.decision).toBe("blocked");
      expect(body.allowed).toBe(false);
      expect(typeof body.reason).toBe("string");
    });

    it("returns guardTriggered=domain-allowlist when domain blocked", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: BLOCKED_DOMAIN,
      });
      expect(status).toBe(200);
      expect(body.guardTriggered).toBe("domain-allowlist");
    });

    it("blocks syscall actions", async () => {
      const { status, body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "syscall:exec",
        target: "localhost",
      });
      expect(status).toBe(200);
      expect(body.decision).toBe("blocked");
      expect(body.guardTriggered).toBe("syscall-protection");
    });

    it("blocks unknown agent with no policy", async () => {
      const { status, body } = await verifyIntent({
        agentId: "agent_nonexistent_xyz",
        action: "http:GET",
        target: ALLOWED_DOMAIN,
      });
      expect(status).toBe(200);
      expect(body.decision).toBe("blocked");
      expect(body.reason).toContain("No policy found");
    });
  });

  describe("response shape", () => {
    it("always returns allowed, decision, reason, cumulativeSpent, remainingBudget", async () => {
      const { body } = await verifyIntent({
        agentId: DEMO_AGENT_ID,
        action: "http:GET",
        target: ALLOWED_DOMAIN,
      });
      expect(typeof body.allowed).toBe("boolean");
      expect(["allowed", "blocked"]).toContain(body.decision);
      expect(typeof body.reason).toBe("string");
      expect(typeof body.cumulativeSpent).toBe("number");
      expect(typeof body.remainingBudget).toBe("number");
    });
  });
});

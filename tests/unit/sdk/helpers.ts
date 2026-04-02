import { vi } from "vitest";

// ── Mock policy factory ───────────────────────────────────────────────────────

export function makeMockPolicy(overrides: Partial<MockPolicy> = {}): MockPolicy {
  return {
    id: "policy_test_01",
    agentId: "agent_test_01",
    maxDailySpend: 100,
    perActionCap: 0,
    maxRatePerMinute: 0,
    allowedEndpoints: JSON.stringify(["api.openai.com", "api.stripe.com"]),
    loopDetectionEnabled: 1,
    loopDetectionMaxCount: 3,
    loopDetectionWindowSec: 10,
    syscallProtectionEnabled: 1,
    destructiveActionsEnabled: 1,
    dataExfilEnabled: 1,
    promptInjectionEnabled: 0,
    blockedPatterns: "[]",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export type MockPolicy = {
  id: string;
  agentId: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string;
  loopDetectionEnabled: number;
  loopDetectionMaxCount: number;
  loopDetectionWindowSec: number;
  syscallProtectionEnabled: number;
  destructiveActionsEnabled: number;
  dataExfilEnabled: number;
  promptInjectionEnabled: number;
  blockedPatterns: string;
  createdAt: number;
  updatedAt: number;
};

// ── Mock intent input factory ─────────────────────────────────────────────────

export function makeMockIntent(overrides: Record<string, unknown> = {}) {
  return {
    agentId: "agent_test_01",
    action: "tool:send_email",
    target: "api.openai.com",
    amount: 0.01,
    estimatedCostUsd: 0.01,
    ...overrides,
  };
}

// ── DB mock helpers ───────────────────────────────────────────────────────────

export function makeDbMock(policy: MockPolicy | null, cumulativeSpent = 0) {
  const selectMock = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          then: vi.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
            Promise.resolve(cb(policy ? [policy] : [])),
          ),
        }),
        orderBy: vi.fn().mockReturnValue(
          Promise.resolve(policy ? [policy] : []),
        ),
      }),
    }),
  });

  const aggregateMock = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        then: vi.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
          Promise.resolve(cb([{ total: cumulativeSpent }])),
        ),
      }),
    }),
  });

  const insertMock = vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  });

  return { selectMock, aggregateMock, insertMock };
}

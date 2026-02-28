export type VerifyIntentInput = {
  action: string;
  target: string;
  estimatedCostUsd?: number;
  metadata?: Record<string, unknown>;
};

export type VerifyIntentResult = {
  allowed: boolean;
  reason: string;
  policyId?: string;
};

export class LimitrumGuard {
  verify(intent: VerifyIntentInput): VerifyIntentResult {
    const endpoint = intent.target.toLowerCase();
    const action = intent.action.toLowerCase();
    const estimatedCost = intent.estimatedCostUsd ?? 0;

    if (estimatedCost > 50) {
      return {
        allowed: false,
        reason: "Daily budget threshold exceeded in mock policy.",
        policyId: "policy_mock_budget_v1",
      };
    }

    if (
      endpoint.includes("unknown") ||
      endpoint.includes("exfil") ||
      endpoint.includes("dropbox")
    ) {
      return {
        allowed: false,
        reason: "Target endpoint is not allowlisted by mock policy.",
        policyId: "policy_mock_allowlist_v1",
      };
    }

    if (action.includes("delete") || action.includes("truncate")) {
      return {
        allowed: false,
        reason: "Destructive action blocked by mock policy.",
        policyId: "policy_mock_destructive_v1",
      };
    }

    return {
      allowed: true,
      reason: "Intent accepted by mock deterministic policy.",
      policyId: "policy_mock_core_v1",
    };
  }
}

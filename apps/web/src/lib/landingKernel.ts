import type { GuardConfig } from "../hooks/usePolicyConfig";
import type { AgentAction, SimResult } from "../hooks/useSimulation";

export type RuntimePolicy = {
  budget: number;
  rate: number;
  perActionCap: number;
  guards: GuardConfig;
  domains: string[];
};

const DEMO_POLICY_KEY = "limitrum-demo-policy";

export function saveDemoPolicy(policy: RuntimePolicy) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DEMO_POLICY_KEY,
    JSON.stringify({ ...policy, savedAt: new Date().toISOString() }),
  );
}

export function hostFromTarget(target: string) {
  try {
    const url = target.includes("://") ? target : `https://${target}`;
    return new URL(url).hostname.toLowerCase();
  } catch {
    return target.toLowerCase().split("/")[0] ?? target.toLowerCase();
  }
}

function domainAllowed(target: string, domains: string[]) {
  const host = hostFromTarget(target);
  if (host.startsWith("local.")) return true;
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function stableLatency(action: AgentAction, index: number) {
  const base = Array.from(action.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 7 + ((base + index * 5) % 19);
}

export function evaluateDemoIntent(
  action: AgentAction,
  policy: RuntimePolicy,
  cumulativeSpend: number,
  index: number,
): SimResult {
  const amount = action.estimatedCostUsd;
  const combined = `${action.action} ${action.target}`.toLowerCase();

  if (policy.guards.syscallProtection && /local\.syscall|spawn_process|shell|\/bin\/|powershell/.test(combined)) {
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: "syscall-protection: local process execution denied before runtime.",
      latency: stableLatency(action, index),
    };
  }

  if (policy.guards.destructiveActions && /\bdelete\b|\bdrop\b|\btruncate\b|rm\s+-rf|wipe|purge/.test(combined)) {
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: "destructive-action: mutation pattern matched the deny policy.",
      latency: stableLatency(action, index),
    };
  }

  if (!domainAllowed(action.target, policy.domains)) {
    const host = hostFromTarget(action.target);
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: `domain-allowlist: ${host} is outside the allowed network boundary.`,
      latency: stableLatency(action, index),
    };
  }

  if (policy.guards.dataExfil && /exfil|unknown|paste|upload/.test(combined)) {
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: "data-exfil: suspicious outbound transfer blocked.",
      latency: stableLatency(action, index),
    };
  }

  if (amount > policy.perActionCap) {
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: `budget-per-action: $${amount.toFixed(2)} exceeds the $${policy.perActionCap.toFixed(2)} action cap.`,
      latency: stableLatency(action, index),
    };
  }

  if (cumulativeSpend + amount > policy.budget) {
    const remaining = Math.max(0, policy.budget - cumulativeSpend);
    return {
      id: `${action.id}-${index}`,
      type: "blocked",
      action: action.action,
      reason: `budget-daily: only $${remaining.toFixed(2)} remains in today's budget.`,
      latency: stableLatency(action, index),
    };
  }

  return {
    id: `${action.id}-${index}`,
    type: "allowed",
    action: action.action,
    reason: "allow: intent passed budget, domain, syscall, and behavior guards.",
    latency: stableLatency(action, index),
  };
}

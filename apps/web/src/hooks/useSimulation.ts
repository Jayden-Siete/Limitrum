"use client";

import { useState } from "react";

export type SimResult = {
  id: string;
  type: "allowed" | "blocked";
  action: string;
  reason: string;
  latency: number;
};

export type AgentAction = {
  id: string;
  action: string;
  target: string;
  estimatedCostUsd: number;
};

type SimulationOptions = {
  apiBaseUrl: string;
  agentId: string;
  budget: number;
  rate: number;
  perActionCap: number;
  guards: Record<string, boolean>;
  domains: string[];
};

/**
 * Manages agent simulation state and runs policy-kernel verify-intent calls.
 */
export function useSimulation(options: SimulationOptions) {
  const [selectedActions, setSelectedActions] = useState<string[]>(["charge-50"]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SimResult[]>([]);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const run = async (agentActions: AgentAction[]) => {
    if (running || selectedActions.length === 0) return;
    setRunning(true);
    setResults([]);

    const chosen = agentActions.filter((a) => selectedActions.includes(a.id));

    for (const [idx, action] of chosen.entries()) {
      const startedAt = performance.now();
      try {
        const response = await fetch(`${options.apiBaseUrl}/v1/verify-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: {
              agentId: options.agentId,
              action: action.action,
              target: action.target,
              amount: action.estimatedCostUsd,
              estimatedCostUsd: action.estimatedCostUsd,
              metadata: {
                ui: "interactive-sandbox",
                budget: options.budget,
                rate: options.rate,
                perActionCap: options.perActionCap,
                guards: options.guards,
                domains: options.domains,
              },
            },
          }),
        });

        const payload = (await response.json()) as {
          decision?: "allowed" | "blocked";
          reason?: string;
        };

        if (!response.ok) {
          throw new Error(payload.reason ?? "Policy Kernel returned an error response.");
        }

        const elapsed = Math.max(8, Math.round(performance.now() - startedAt));
        setResults((prev) => [
          ...prev,
          {
            id: `${action.id}-${idx}`,
            type: payload.decision === "blocked" ? "blocked" : "allowed",
            action: action.action,
            reason: payload.reason ?? "No reason returned by Policy Kernel",
            latency: elapsed,
          },
        ]);
      } catch {
        const elapsed = Math.max(8, Math.round(performance.now() - startedAt));
        setResults((prev) => [
          ...prev,
          {
            id: `${action.id}-${idx}`,
            type: "blocked",
            action: action.action,
            reason: "Policy Kernel unavailable. Verify API is running on localhost:8000.",
            latency: elapsed,
          },
        ]);
      }
    }

    setRunning(false);
  };

  return { selectedActions, running, results, toggleAction, run };
}

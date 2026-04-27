"use client";

import { useState, useCallback } from "react";
import { saveDemoPolicy } from "../lib/landingKernel";

export type GuardConfig = {
  loopDetection: boolean;
  syscallProtection: boolean;
  dataExfil: boolean;
  destructiveActions: boolean;
  promptInjection: boolean;
};

export type PolicyConfig = {
  budget: number;
  rate: number;
  cost: number;
  guards: GuardConfig;
  domains: string[];
  domainInput: string;
  applySaved: boolean;
  applying: boolean;
  applyError: string | null;
};

export type UsePolicyConfigOptions = {
  /** Base URL for the Limitrum API */
  apiBaseUrl?: string;
  /** Agent ID to apply policy to (for sandbox simulation) */
  agentId?: string;
  /** API key for authentication */
  apiKey?: string;
};

const DEFAULT_DOMAINS = [
  "api.stripe.com",
  "api.openai.com",
  "hooks.slack.com",
];

/**
 * Manages all policy configuration state for the interactive sandbox.
 * Optionally connects to the real API to apply policies.
 */
export function usePolicyConfig(
  initialDomains: string[] = DEFAULT_DOMAINS,
  options: UsePolicyConfigOptions = {}
) {
  const { apiBaseUrl, agentId, apiKey } = options;

  const [budget, setBudget] = useState(50);
  const [rate, setRate] = useState(100);
  const [cost, setCost] = useState(100);
  const [guards, setGuards] = useState<GuardConfig>({
    loopDetection: true,
    syscallProtection: true,
    dataExfil: true,
    destructiveActions: true,
    promptInjection: false,
  });
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [applySaved, setApplySaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const toggleGuard = (key: keyof GuardConfig) => {
    setGuards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addDomain = () => {
    const next = domainInput.trim().toLowerCase();
    if (!next || domains.includes(next)) return;
    setDomains((prev) => [...prev, next]);
    setDomainInput("");
  };

  const removeDomain = (domain: string) => {
    setDomains((prev) => prev.filter((d) => d !== domain));
  };

  const applyPolicy = useCallback(async () => {
    setApplyError(null);

    saveDemoPolicy({
      budget,
      rate,
      perActionCap: cost,
      guards,
      domains,
    });

    if (!apiBaseUrl || !agentId || /localhost|127\.0\.0\.1|\[?::1\]?/.test(apiBaseUrl)) {
      setApplySaved(true);
      window.setTimeout(() => setApplySaved(false), 2500);
      return;
    }

    setApplying(true);

    try {
      const payload = {
        maxDailySpend: budget,
        perActionCap: cost,
        maxRatePerMinute: rate,
        allowedEndpoints: domains,
        loopDetectionEnabled: guards.loopDetection,
        loopDetectionMaxCount: 5,
        loopDetectionWindowSec: 10,
        syscallProtectionEnabled: guards.syscallProtection,
        destructiveActionsEnabled: guards.destructiveActions,
        dataExfilEnabled: guards.dataExfil,
        promptInjectionEnabled: guards.promptInjection,
        blockedPatterns: [],
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["X-Limitrum-API-Key"] = apiKey;
      }

      const response = await fetch(`${apiBaseUrl}/v1/agents/${agentId}/policy`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setApplySaved(true);
      window.setTimeout(() => setApplySaved(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to apply policy";
      setApplyError(message);
      console.error("[usePolicyConfig] Apply policy failed:", err);
    } finally {
      setApplying(false);
    }
  }, [apiBaseUrl, agentId, apiKey, budget, cost, rate, domains, guards]);

  return {
    budget,
    rate,
    cost,
    guards,
    domains,
    domainInput,
    applySaved,
    applying,
    applyError,
    setBudget,
    setRate,
    setCost,
    setDomainInput,
    toggleGuard,
    addDomain,
    removeDomain,
    applyPolicy,
  };
}

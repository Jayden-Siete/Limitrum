"use client";

import { useState } from "react";

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
};

const DEFAULT_DOMAINS = [
  "api.stripe.com",
  "api.openai.com",
  "hooks.slack.com",
];

/**
 * Manages all policy configuration state for the interactive sandbox.
 */
export function usePolicyConfig(initialDomains: string[] = DEFAULT_DOMAINS) {
  const [budget, setBudget] = useState(50);
  const [rate, setRate] = useState(100);
  const [cost, setCost] = useState(5);
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

  const applyPolicy = () => {
    setApplySaved(true);
    window.setTimeout(() => setApplySaved(false), 2500);
  };

  return {
    budget,
    rate,
    cost,
    guards,
    domains,
    domainInput,
    applySaved,
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useCliAutoplay } from "../../hooks/useCliAutoplay";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { useTheme } from "../../hooks/useTheme";
import { CodeSection } from "./CodeSection";
import { CtaBlock } from "./CtaBlock";
import { Features } from "./Features";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { InteractiveSandbox } from "./InteractiveSandbox";
import { Pricing } from "./Pricing";
import { TickerAndProps } from "./TickerAndProps";
import { agentActions, cliPresets, defaultDomains, terminalAutoplayLines } from "./data";

type TabKey = "policy" | "agent" | "cli";
type CliLine = { type: string; text: string };
type SimResult = { id: string; type: "allowed" | "blocked"; action: string; reason: string; latency: number };

type LandingPageProps = {
  logoSrc?: string;
  shellSrc?: string;
};

export function LandingPage({ logoSrc, shellSrc }: LandingPageProps) {
  const [theme, toggleTheme] = useTheme("dark");
  const [copied, copyToClipboard] = useCopyToClipboard(2000);
  const [activeTab, setActiveTab] = useState<TabKey>("policy");

  const [budget, setBudget] = useState(50);
  const [rate, setRate] = useState(100);
  const [cost, setCost] = useState(5);
  const [guards, setGuards] = useState({
    loopDetection: true,
    syscallProtection: true,
    dataExfil: true,
    destructiveActions: true,
    promptInjection: false,
  });
  const [domains, setDomains] = useState(defaultDomains);
  const [domainInput, setDomainInput] = useState("");
  const [applySaved, setApplySaved] = useState(false);

  const [selectedActions, setSelectedActions] = useState<string[]>(["charge-50"]);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimResult[]>([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

  const cliCommands = useMemo(() => Object.keys(cliPresets), []);
  const [selectedCmd, setSelectedCmd] = useState("limitrum simulate");
  const [cliInput, setCliInput] = useState("limitrum simulate");
  const [cliLines, setCliLines] = useState<CliLine[]>([]);

  const termLines = useCliAutoplay(terminalAutoplayLines);

  const onCopyInstall = () => copyToClipboard("pnpm add @limitrum/sdk");

  const onToggleGuard = (key: string) => {
    setGuards((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const onDomainEnter = () => {
    const next = domainInput.trim().toLowerCase();
    if (!next || domains.includes(next)) {
      return;
    }
    setDomains((prev) => [...prev, next]);
    setDomainInput("");
  };

  const onApplyPolicy = () => {
    setApplySaved(true);
    window.setTimeout(() => setApplySaved(false), 2500);
  };

  const onRunSimulation = async () => {
    if (runningSimulation || selectedActions.length === 0) {
      return;
    }
    setRunningSimulation(true);
    setSimulationResults([]);
    const chosen = agentActions.filter((action) => selectedActions.includes(action.id));
    for (const [idx, action] of chosen.entries()) {
      const startedAt = performance.now();
      try {
        const response = await fetch(`${apiBaseUrl}/v1/verify-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: {
              agentId: "agent_sales_01",
              action: action.action,
              target: action.target,
              amount: action.estimatedCostUsd,
              estimatedCostUsd: action.estimatedCostUsd,
              metadata: {
                ui: "interactive-sandbox",
                budget,
                rate,
                perActionCap: cost,
                guards,
                domains,
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
        setSimulationResults((prev) => [
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
        setSimulationResults((prev) => [
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
    setRunningSimulation(false);
  };

  const animateCli = (command: string) => {
    const rows = cliPresets[command] ?? [
      ["prompt", `$ ${command}`],
      ["err", `  command not found: ${command}`],
      ["dim", "  Run `limitrum --help` for usage."],
    ];
    setCliLines([]);
    rows.forEach(([type, text], idx) => {
      window.setTimeout(
        () => setCliLines((prev) => [...prev, { type, text }]),
        idx === 0 ? 40 : 120 + idx * 85,
      );
    });
  };

  useEffect(() => {
    animateCli(selectedCmd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCliCommand = () => {
    animateCli(cliInput.trim() || "limitrum --help");
  };

  return (
    <main>
      <Hero
        copied={copied}
        logoSrc={logoSrc}
        onCopyInstall={onCopyInstall}
        onToggleTheme={toggleTheme}
        shellSrc={shellSrc}
        theme={theme}
      />
      <TickerAndProps />

      <InteractiveSandbox
        activeTab={activeTab}
        cli={{
          selectedCmd,
          input: cliInput,
          lines: cliLines,
          commands: cliCommands,
        }}
        onCli={{
          onSelectCommand: (cmd) => {
            setSelectedCmd(cmd);
            setCliInput(cmd);
            animateCli(cmd);
          },
          onInput: setCliInput,
          onRun: runCliCommand,
        }}
        onPolicy={{
          onBudget: setBudget,
          onRate: setRate,
          onCost: setCost,
          onToggleGuard,
          onDomainInput: setDomainInput,
          onDomainEnter,
          onRemoveDomain: (domain) => setDomains((prev) => prev.filter((d) => d !== domain)),
          onApplyPolicy,
        }}
        onSimulation={{
          onToggleAction: (id) =>
            setSelectedActions((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])),
          onRun: onRunSimulation,
        }}
        onTab={setActiveTab}
        policy={{
          budget,
          rate,
          cost,
          guards,
          domains,
          domainInput,
          applySaved,
        }}
        simulation={{
          actions: agentActions,
          selected: selectedActions,
          running: runningSimulation,
          results: simulationResults,
        }}
      />

      <CodeSection termLines={termLines} />
      <Features />
      <Pricing />
      <CtaBlock />
      <Footer theme={theme} />
    </main>
  );
}

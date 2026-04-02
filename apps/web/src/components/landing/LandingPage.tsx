"use client";

import { useEffect, useMemo, useState } from "react";
import { useCliAutoplay } from "../../hooks/useCliAutoplay";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { usePolicyConfig } from "../../hooks/usePolicyConfig";
import { useSimulation } from "../../hooks/useSimulation";
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

type LandingPageProps = {
  logoSrc?: string;
  shellSrc?: string;
};

export function LandingPage({ logoSrc, shellSrc }: LandingPageProps) {
  // ── Global state ────────────────────────────────────────────────
  const [theme, toggleTheme] = useTheme("dark");
  const [copied, copyToClipboard] = useCopyToClipboard(2000);
  const [activeTab, setActiveTab] = useState<TabKey>("policy");

  // ── Policy config (budget, rate, guards, domains) ───────────────
  const pol = usePolicyConfig(defaultDomains);

  // ── Agent simulation ────────────────────────────────────────────
  const apiBaseUrl = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";
  const sim = useSimulation({
    apiBaseUrl,
    agentId: "agent_sales_01",
    budget: pol.budget,
    rate: pol.rate,
    perActionCap: pol.cost,
    guards: pol.guards,
    domains: pol.domains,
  });

  // ── CLI sandbox ─────────────────────────────────────────────────
  const cliCommands = useMemo(() => Object.keys(cliPresets), []);
  const [selectedCmd, setSelectedCmd] = useState("limitrum simulate");
  const [cliInput, setCliInput] = useState("limitrum simulate");
  const [cliLines, setCliLines] = useState<CliLine[]>([]);

  // ── Terminal autoplay (CodeSection) ────────────────────────────
  const termLines = useCliAutoplay(terminalAutoplayLines);

  // ── Handlers ────────────────────────────────────────────────────
  const onCopyInstall = () => copyToClipboard("pnpm add @limitrum/sdk");

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

  // ── Render ──────────────────────────────────────────────────────
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
          onBudget: pol.setBudget,
          onRate: pol.setRate,
          onCost: pol.setCost,
          onToggleGuard: (key) => pol.toggleGuard(key as keyof typeof pol.guards),
          onDomainInput: pol.setDomainInput,
          onDomainEnter: pol.addDomain,
          onRemoveDomain: pol.removeDomain,
          onApplyPolicy: pol.applyPolicy,
        }}
        onSimulation={{
          onToggleAction: sim.toggleAction,
          onRun: () => sim.run(agentActions),
        }}
        onTab={setActiveTab}
        policy={{
          budget: pol.budget,
          rate: pol.rate,
          cost: pol.cost,
          guards: pol.guards,
          domains: pol.domains,
          domainInput: pol.domainInput,
          applySaved: pol.applySaved,
        }}
        simulation={{
          actions: agentActions,
          selected: sim.selectedActions,
          running: sim.running,
          results: sim.results,
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

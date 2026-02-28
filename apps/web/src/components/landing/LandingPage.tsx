"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CodeSection } from "./CodeSection";
import { Features } from "./Features";
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);
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

  const cliCommands = useMemo(() => Object.keys(cliPresets), []);
  const [selectedCmd, setSelectedCmd] = useState("limitrum simulate");
  const [cliInput, setCliInput] = useState("limitrum simulate");
  const [cliLines, setCliLines] = useState<CliLine[]>([]);

  const [termLines, setTermLines] = useState<CliLine[]>([]);
  const termTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const onCopyInstall = async () => {
    await navigator.clipboard.writeText("pnpm add @limitrum/sdk");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

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

  const onRunSimulation = () => {
    if (runningSimulation || selectedActions.length === 0) {
      return;
    }
    setRunningSimulation(true);
    setSimulationResults([]);
    const chosen = agentActions.filter((action) => selectedActions.includes(action.id));
    chosen.forEach((action, idx) => {
      window.setTimeout(() => {
        setSimulationResults((prev) => [
          ...prev,
          {
            id: `${action.id}-${idx}`,
            type: action.type,
            action: action.action,
            reason: action.reason,
            latency: Math.floor(Math.random() * 20) + 8,
          },
        ]);
        if (idx === chosen.length - 1) {
          setRunningSimulation(false);
        }
      }, 250 + idx * 700);
    });
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

  useEffect(() => {
    let idx = 0;
    const play = () => {
      setTermLines([]);
      const append = () => {
        if (idx >= terminalAutoplayLines.length) {
          idx = 0;
          termTimerRef.current = window.setTimeout(play, 2400);
          return;
        }
        const [type, text] = terminalAutoplayLines[idx++];
        setTermLines((prev) => [...prev, { type, text }]);
        termTimerRef.current = window.setTimeout(append, type === "prompt" ? 900 : 350);
      };
      append();
    };
    play();
    return () => {
      if (termTimerRef.current) {
        window.clearTimeout(termTimerRef.current);
      }
    };
  }, []);

  return (
    <main>
      <Hero
        copied={copied}
        logoSrc={logoSrc}
        onCopyInstall={onCopyInstall}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
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
    </main>
  );
}

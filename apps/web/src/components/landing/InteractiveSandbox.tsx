import { AgentSimulation } from "./AgentSimulation";
import { CliPanel } from "./CliPanel";
import { PolicyPanel } from "./PolicyPanel";
import type { AgentAction } from "./data";

type TabKey = "policy" | "agent" | "cli";

type InteractiveSandboxProps = {
  activeTab: TabKey;
  onTab: (tab: TabKey) => void;
  policy: {
    budget: number;
    rate: number;
    cost: number;
    guards: Record<string, boolean>;
    domains: string[];
    domainInput: string;
    applySaved: boolean;
  };
  simulation: {
    actions: AgentAction[];
    selected: string[];
    running: boolean;
    results: { id: string; type: "allowed" | "blocked"; action: string; reason: string; latency: number }[];
  };
  cli: {
    selectedCmd: string;
    input: string;
    lines: { type: string; text: string }[];
    commands: string[];
  };
  onPolicy: {
    onBudget: (v: number) => void;
    onRate: (v: number) => void;
    onCost: (v: number) => void;
    onToggleGuard: (k: string) => void;
    onDomainInput: (v: string) => void;
    onDomainEnter: () => void;
    onRemoveDomain: (domain: string) => void;
    onApplyPolicy: () => void;
  };
  onSimulation: {
    onToggleAction: (id: string) => void;
    onRun: () => void;
  };
  onCli: {
    onSelectCommand: (cmd: string) => void;
    onInput: (v: string) => void;
    onRun: () => void;
  };
};

export function InteractiveSandbox(props: InteractiveSandboxProps) {
  return (
    <section className="sandbox-section section divider" id="sandbox">
      <div className="section-inner">
        <p className="eyebrow-label">Interactive Sandbox</p>
        <h2 className="section-h2">Configure. Simulate. Ship.</h2>
        <p className="section-p">
          Define policies, simulate real agent actions, and run CLI commands — all in the browser.
        </p>

        <div className="sandbox-outer">
          <div className="sandbox-tabbar">
            <button
              className={`stab ${props.activeTab === "policy" ? "active" : ""}`}
              onClick={() => props.onTab("policy")}
              type="button"
            >
              Policy Config
            </button>
            <button
              className={`stab ${props.activeTab === "agent" ? "active" : ""}`}
              onClick={() => props.onTab("agent")}
              type="button"
            >
              Agent Simulation
            </button>
            <button
              className={`stab ${props.activeTab === "cli" ? "active" : ""}`}
              onClick={() => props.onTab("cli")}
              type="button"
            >
              $ CLI Mode
            </button>
          </div>

          {props.activeTab === "policy" ? (
            <PolicyPanel
              applySaved={props.policy.applySaved}
              budget={props.policy.budget}
              cost={props.policy.cost}
              domainInput={props.policy.domainInput}
              domains={props.policy.domains}
              guards={props.policy.guards}
              onApplyPolicy={props.onPolicy.onApplyPolicy}
              onBudget={props.onPolicy.onBudget}
              onCost={props.onPolicy.onCost}
              onDomainEnter={props.onPolicy.onDomainEnter}
              onDomainInput={props.onPolicy.onDomainInput}
              onRate={props.onPolicy.onRate}
              onRemoveDomain={props.onPolicy.onRemoveDomain}
              onToggleGuard={props.onPolicy.onToggleGuard}
              rate={props.policy.rate}
            />
          ) : null}

          {props.activeTab === "agent" ? (
            <AgentSimulation
              actions={props.simulation.actions}
              onRun={props.onSimulation.onRun}
              onToggleAction={props.onSimulation.onToggleAction}
              results={props.simulation.results}
              running={props.simulation.running}
              selected={props.simulation.selected}
            />
          ) : null}

          {props.activeTab === "cli" ? (
            <CliPanel
              commands={props.cli.commands}
              input={props.cli.input}
              lines={props.cli.lines}
              onInput={props.onCli.onInput}
              onRun={props.onCli.onRun}
              onSelectCommand={props.onCli.onSelectCommand}
              selectedCmd={props.cli.selectedCmd}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

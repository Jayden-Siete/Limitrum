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
    applying?: boolean;
    applyError?: string | null;
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
    onApplyPolicy: () => void | Promise<void>;
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

const tabs: { key: TabKey; label: string; meta: string }[] = [
  { key: "policy", label: "Policy", meta: "Define constraints" },
  { key: "agent", label: "Simulation", meta: "Verify actions" },
  { key: "cli", label: "CLI", meta: "Inspect kernel" },
];

export function InteractiveSandbox(props: InteractiveSandboxProps) {
  return (
    <section className="sandbox-section section" id="sandbox">
      <div className="section-inner">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow-label">Interactive sandbox</p>
            <h2 className="section-h2">See policy become runtime behavior.</h2>
          </div>
          <p className="section-p">
            Tune budgets, domain allowlists, and behavioral guards. Then run agent actions through the same verdict
            loop your production system would call.
          </p>
        </div>

        <div className="sandbox-outer">
          <div className="sandbox-tabbar">
            {tabs.map((tab) => (
              <button
                className={`stab ${props.activeTab === tab.key ? "active" : ""}`}
                key={tab.key}
                onClick={() => props.onTab(tab.key)}
                type="button"
              >
                <span>{tab.label}</span>
                <small>{tab.meta}</small>
              </button>
            ))}
          </div>

          {props.activeTab === "policy" ? (
            <PolicyPanel
              applyError={props.policy.applyError}
              applySaved={props.policy.applySaved}
              applying={props.policy.applying}
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

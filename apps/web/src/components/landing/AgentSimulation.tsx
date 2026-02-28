import type { AgentAction } from "./data";

type SimResult = {
  id: string;
  type: "allowed" | "blocked";
  action: string;
  reason: string;
  latency: number;
};

type AgentSimulationProps = {
  actions: AgentAction[];
  selected: string[];
  running: boolean;
  results: SimResult[];
  onToggleAction: (id: string) => void;
  onRun: () => void;
};

export function AgentSimulation({
  actions,
  selected,
  running,
  results,
  onToggleAction,
  onRun,
}: AgentSimulationProps) {
  return (
    <div className="sandbox-panel two-cols">
      <div className="agent-left">
        <p className="pol-section-title">Choose Agent Actions to Simulate</p>
        {actions.map((action) => {
          const isSelected = selected.includes(action.id);
          return (
            <button
              className={`agent-card ${isSelected ? "selected" : ""}`}
              key={action.id}
              onClick={() => onToggleAction(action.id)}
              type="button"
            >
              <div className={`agent-card-icon ${action.type === "allowed" ? "ac-safe" : "ac-danger"}`}>
                {action.icon}
              </div>
              <div className="agent-card-body">
                <div className="agent-card-action">{action.displayAction}</div>
                <div className="agent-card-desc">{action.description}</div>
              </div>
            </button>
          );
        })}
        <button className={`run-sim-btn ${running ? "running" : ""}`} onClick={onRun} type="button">
          {running ? "⟳ Running..." : "▶ Run Selected Actions"}
        </button>
      </div>
      <div className="agent-right">
        <p className="pol-section-title">Kernel Output</p>
        <div className="sim-results">
          {results.length === 0 ? (
            <div className="sim-empty">Select actions on the left and click Run.</div>
          ) : (
            results.map((r) => (
              <div className={`sim-result ${r.type === "allowed" ? "sr-allowed" : "sr-blocked"}`} key={r.id}>
                <div className="sr-header">
                  <span className={`sr-status ${r.type === "allowed" ? "sr-ok" : "sr-err"}`}>
                    {r.type === "allowed" ? "✓ ALLOWED" : "✗ BLOCKED"}
                  </span>
                  <span className="sr-latency">{r.latency}ms</span>
                </div>
                <div className="sr-action">{r.action}</div>
                <div className="sr-reason">{r.reason}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type PolicyPanelProps = {
  budget: number;
  rate: number;
  cost: number;
  guards: Record<string, boolean>;
  domains: string[];
  domainInput: string;
  applySaved: boolean;
  onBudget: (v: number) => void;
  onRate: (v: number) => void;
  onCost: (v: number) => void;
  onToggleGuard: (k: string) => void;
  onDomainInput: (v: string) => void;
  onDomainEnter: () => void;
  onRemoveDomain: (domain: string) => void;
  onApplyPolicy: () => void;
};

function boolColor(v: boolean) {
  return v ? "var(--cyan2)" : "var(--red)";
}

export function PolicyPanel(props: PolicyPanelProps) {
  const {
    budget,
    rate,
    cost,
    guards,
    domains,
    domainInput,
    applySaved,
    onBudget,
    onRate,
    onCost,
    onToggleGuard,
    onDomainInput,
    onDomainEnter,
    onRemoveDomain,
    onApplyPolicy,
  } = props;

  return (
    <div className="sandbox-panel two-cols">
      <div className="pol-left">
        <p className="pol-section-title">Financial & Rate Controls</p>
        <div className="pol-field">
          <div className="pol-label">Daily budget cap ${budget}.00</div>
          <input
            className="pol-range"
            max={1000}
            min={10}
            onChange={(e) => onBudget(Number(e.target.value))}
            step={10}
            type="range"
            value={budget}
          />
        </div>
        <div className="pol-field">
          <div className="pol-label">Rate limit {rate} / min</div>
          <input
            className="pol-range"
            max={1000}
            min={10}
            onChange={(e) => onRate(Number(e.target.value))}
            step={10}
            type="range"
            value={rate}
          />
        </div>
        <div className="pol-field">
          <div className="pol-label">Max cost per action ${cost}.00</div>
          <input
            className="pol-range"
            max={100}
            min={1}
            onChange={(e) => onCost(Number(e.target.value))}
            step={1}
            type="range"
            value={cost}
          />
        </div>

        <p className="pol-section-title">Behavioral Guards</p>
        {[
          ["loopDetection", "Loop detection"],
          ["syscallProtection", "Syscall protection"],
          ["dataExfil", "Data exfil detection"],
          ["destructiveActions", "Destructive action guard"],
          ["promptInjection", "Prompt injection shield"],
        ].map(([key, label]) => (
          <div className="toggle-row" key={key}>
            <span>{label}</span>
            <button
              className={`tog ${guards[key] ? "on" : ""}`}
              onClick={() => onToggleGuard(key)}
              type="button"
            />
          </div>
        ))}
      </div>

      <div className="pol-right">
        <p className="pol-section-title">Domain Allowlist</p>
        <div className="tag-input-wrap">
          {domains.map((domain) => (
            <span className="tag" key={domain}>
              {domain}
              <button className="tag-remove" onClick={() => onRemoveDomain(domain)} type="button">
                ×
              </button>
            </span>
          ))}
          <input
            className="tag-add-input"
            onChange={(e) => onDomainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onDomainEnter();
              }
            }}
            placeholder="Add domain..."
            value={domainInput}
          />
        </div>

        <p className="pol-section-title">Generated Config</p>
        <pre className="pol-preview">
          <span style={{ color: "var(--text3)" }}>{"// limitrum.config.ts (auto-generated)\n"}</span>
          <span style={{ color: "var(--cyan2)" }}>export default</span> {"{\n"}
          {"  budget: { daily: "}
          <span style={{ color: "var(--green)" }}>{budget}</span>
          {", perAction: "}
          <span style={{ color: "var(--green)" }}>{cost}</span>
          {", currency: "}
          <span style={{ color: "#CE9178" }}>'USD'</span>
          {" },\n"}
          {"  rateLimit: { max: "}
          <span style={{ color: "var(--green)" }}>{rate}</span>
          {", window: "}
          <span style={{ color: "#CE9178" }}>'1m'</span>
          {" },\n"}
          {"  guards: {\n"}
          {"    loopDetection: "}
          <span style={{ color: boolColor(guards.loopDetection) }}>{String(guards.loopDetection)}</span>
          {",\n    syscallProtection: "}
          <span style={{ color: boolColor(guards.syscallProtection) }}>
            {String(guards.syscallProtection)}
          </span>
          {",\n    dataExfil: "}
          <span style={{ color: boolColor(guards.dataExfil) }}>{String(guards.dataExfil)}</span>
          {",\n    destructiveActions: "}
          <span style={{ color: boolColor(guards.destructiveActions) }}>
            {String(guards.destructiveActions)}
          </span>
          {",\n    promptInjection: "}
          <span style={{ color: boolColor(guards.promptInjection) }}>
            {String(guards.promptInjection)}
          </span>
          {",\n  },\n"}
          {"  allow: ["}
          {domains.map((domain, idx) => (
            <span key={domain}>
              {idx > 0 ? ", " : ""}
              <span style={{ color: "#CE9178" }}>'{domain}'</span>
            </span>
          ))}
          {"],\n}"}
        </pre>

        <button className={`apply-btn ${applySaved ? "saved" : ""}`} onClick={onApplyPolicy} type="button">
          {applySaved ? "✓ Policy applied" : "Apply & Save Policy"}
        </button>
      </div>
    </div>
  );
}

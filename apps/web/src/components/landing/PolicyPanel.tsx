type PolicyPanelProps = {
  budget: number;
  rate: number;
  cost: number;
  guards: Record<string, boolean>;
  domains: string[];
  domainInput: string;
  applySaved: boolean;
  applying?: boolean;
  applyError?: string | null;
  onBudget: (v: number) => void;
  onRate: (v: number) => void;
  onCost: (v: number) => void;
  onToggleGuard: (k: string) => void;
  onDomainInput: (v: string) => void;
  onDomainEnter: () => void;
  onRemoveDomain: (domain: string) => void;
  onApplyPolicy: () => void | Promise<void>;
};

function boolColor(v: boolean) {
  return v ? "var(--green)" : "var(--red)";
}

const guardLabels = [
  ["loopDetection", "Loop detection"],
  ["syscallProtection", "Syscall protection"],
  ["dataExfil", "Data exfil detection"],
  ["destructiveActions", "Destructive actions"],
  ["promptInjection", "Prompt injection shield"],
];

export function PolicyPanel(props: PolicyPanelProps) {
  const {
    budget,
    rate,
    cost,
    guards,
    domains,
    domainInput,
    applySaved,
    applying,
    applyError,
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
        <p className="pol-section-title">Runtime constraints</p>
        <div className="policy-metrics">
          <div>
            <span>Daily budget</span>
            <strong>${budget}</strong>
          </div>
          <div>
            <span>Rate limit</span>
            <strong>{rate}/min</strong>
          </div>
          <div>
            <span>Action cap</span>
            <strong>${cost}</strong>
          </div>
        </div>

        <div className="pol-field">
          <div className="pol-label">Daily budget cap</div>
          <input className="pol-range" max={1000} min={10} onChange={(e) => onBudget(Number(e.target.value))} step={10} type="range" value={budget} />
        </div>
        <div className="pol-field">
          <div className="pol-label">Requests per minute</div>
          <input className="pol-range" max={1000} min={10} onChange={(e) => onRate(Number(e.target.value))} step={10} type="range" value={rate} />
        </div>
        <div className="pol-field">
          <div className="pol-label">Maximum cost per action</div>
          <input className="pol-range" max={100} min={1} onChange={(e) => onCost(Number(e.target.value))} step={1} type="range" value={cost} />
        </div>

        <p className="pol-section-title">Behavioral guards</p>
        {guardLabels.map(([key, label]) => (
          <div className="toggle-row" key={key}>
            <span>{label}</span>
            <button className={`tog ${guards[key] ? "on" : ""}`} onClick={() => onToggleGuard(key)} type="button" />
          </div>
        ))}
      </div>

      <div className="pol-right">
        <p className="pol-section-title">Allowed network boundary</p>
        <div className="tag-input-wrap">
          {domains.map((domain) => (
            <span className="tag" key={domain}>
              {domain}
              <button className="tag-remove" onClick={() => onRemoveDomain(domain)} type="button" aria-label={`Remove ${domain}`}>
                x
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

        <p className="pol-section-title">Generated policy</p>
        <pre className="pol-preview">
          <span style={{ color: "var(--text3)" }}>{"// limitrum.config.ts\n"}</span>
          <span style={{ color: "var(--cyan2)" }}>export default</span> {"{\n"}
          {"  budget: { daily: "}
          <span style={{ color: "var(--green)" }}>{budget}</span>
          {", perAction: "}
          <span style={{ color: "var(--green)" }}>{cost}</span>
          {" },\n"}
          {"  rateLimit: { max: "}
          <span style={{ color: "var(--green)" }}>{rate}</span>
          {", window: '1m' },\n"}
          {"  guards: {\n"}
          {"    loopDetection: "}
          <span style={{ color: boolColor(guards.loopDetection) }}>{String(guards.loopDetection)}</span>
          {",\n    syscallProtection: "}
          <span style={{ color: boolColor(guards.syscallProtection) }}>{String(guards.syscallProtection)}</span>
          {",\n    dataExfil: "}
          <span style={{ color: boolColor(guards.dataExfil) }}>{String(guards.dataExfil)}</span>
          {",\n    destructiveActions: "}
          <span style={{ color: boolColor(guards.destructiveActions) }}>{String(guards.destructiveActions)}</span>
          {",\n    promptInjection: "}
          <span style={{ color: boolColor(guards.promptInjection) }}>{String(guards.promptInjection)}</span>
          {",\n  },\n"}
          {"  allow: ["}
          {domains.map((domain, idx) => (
            <span key={domain}>
              {idx > 0 ? ", " : ""}
              <span style={{ color: "#d19a66" }}>'{domain}'</span>
            </span>
          ))}
          {"],\n}"}
        </pre>

        <button
          className={`apply-btn ${applySaved ? "saved" : ""} ${applying ? "applying" : ""}`}
          disabled={applying}
          onClick={onApplyPolicy}
          type="button"
        >
          {applySaved ? "Policy applied" : applying ? "Applying..." : "Apply policy"}
        </button>
        {applyError && <div className="apply-error">{applyError}</div>}
      </div>
    </div>
  );
}

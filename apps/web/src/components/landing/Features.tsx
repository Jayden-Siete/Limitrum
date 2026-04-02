type Feature = {
  icon: string;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: "🌐",
    title: "Domain Allowlisting",
    description: "Every outbound request is checked against an explicit allowlist. Unknown domains are blocked before any data leaves your system.",
  },
  {
    icon: "💰",
    title: "Budget Caps",
    description: "Set daily and per-action spend limits. The kernel enforces them deterministically — no LLM can override a hard budget cap.",
  },
  {
    icon: "🔁",
    title: "Loop Detection",
    description: "Detects repeated identical actions within a configurable time window. Stops runaway agent loops before they cause damage.",
  },
  {
    icon: "🛡",
    title: "Syscall Protection",
    description: "Blocks process-spawn, shell-exec, and filesystem targets. Autonomous agents cannot escape their sandbox.",
  },
  {
    icon: "📋",
    title: "Full Audit Trail",
    description: "Every intent — allowed or blocked — is logged to a tamper-evident SQLite audit log with guard, reason, and latency.",
  },
  {
    icon: "⚡",
    title: "Out-of-Band Kernel",
    description: "The Policy Kernel runs out-of-process. No prompt injection can reach it. Enforcement is structurally separate from the LLM.",
  },
];

export function Features() {
  return (
    <section className="section divider" id="features">
      <div className="section-inner">
        <p className="eyebrow-label">Capabilities</p>
        <h2 className="section-h2">Every guard your CISO has been asking for.</h2>
        <p className="section-p" style={{ maxWidth: 560 }}>
          10 deterministic behavioral guards. Zero LLM involvement. Auditable by design.
        </p>
        <div className="features-grid">
          {features.map((feature) => (
            <article className="feat" key={feature.title}>
              <div className="feat-icon">{feature.icon}</div>
              <div className="feat-h">{feature.title}</div>
              <div className="feat-p">{feature.description}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

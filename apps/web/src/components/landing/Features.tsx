import { Activity, DatabaseZap, Fingerprint, Gauge, KeyRound, LockKeyhole, type LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: LockKeyhole,
    title: "Out-of-band kernel",
    description: "The enforcement layer is separate from the agent and cannot be overridden by prompt injection.",
  },
  {
    icon: Gauge,
    title: "Budget and rate limits",
    description: "Hard caps stop runaway spend, API abuse, and repeated tool calls before execution.",
  },
  {
    icon: Fingerprint,
    title: "Intent verification",
    description: "Every tool call is normalized into a signed intent, checked, and returned with a reasoned verdict.",
  },
  {
    icon: DatabaseZap,
    title: "Data exfil controls",
    description: "Domain allowlists and destructive action guards reduce the blast radius of connected agents.",
  },
  {
    icon: Activity,
    title: "Audit-ready logs",
    description: "Security teams get action, target, verdict, policy hash, agent identity, and latency in one trail.",
  },
  {
    icon: KeyRound,
    title: "Key lifecycle",
    description: "Production API keys can be rotated, revoked, observed, and tied to the agents using them.",
  },
];

export function Features() {
  return (
    <section className="section capability-section" id="features">
      <div className="section-inner">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow-label">Security surface</p>
            <h2 className="section-h2">A kernel-shaped answer to agent risk.</h2>
          </div>
          <p className="section-p">
            Limitrum is not another monitoring panel. It is a policy decision point that sits before money moves,
            files change, processes spawn, or data leaves.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feat" key={feature.title}>
                <div className="feat-icon">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
                </div>
                <div className="feat-h">{feature.title}</div>
                <div className="feat-p">{feature.description}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

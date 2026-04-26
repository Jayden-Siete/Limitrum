type Plan = {
  tier: string;
  price: string;
  period?: string;
  verifs: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    tier: "Open source",
    price: "$0",
    period: "/mo",
    verifs: "Self-hosted core",
    features: ["SDK and local kernel", "SQLite audit log", "Core policy checks", "Community support"],
    cta: "Start locally",
  },
  {
    tier: "Developer Cloud",
    price: "$49",
    period: "/mo",
    verifs: "50k verifications/mo",
    features: ["Hosted policy API", "API key lifecycle", "Budget reports", "Email support"],
    cta: "Open sandbox",
    featured: true,
  },
  {
    tier: "Team",
    price: "$249",
    period: "/mo",
    verifs: "500k verifications/mo",
    features: ["Shared policies", "SIEM export", "Custom blocked patterns", "Priority support"],
    cta: "Talk to us",
  },
  {
    tier: "Enterprise",
    price: "Custom",
    verifs: "Dedicated deployment",
    features: ["On-prem or VPC", "SLA and SSO", "Security review support", "Custom guardrails"],
    cta: "Contact sales",
  },
];

export function Pricing() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="section-inner">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow-label">Pricing</p>
            <h2 className="section-h2">Start in code. Scale into production.</h2>
          </div>
          <p className="section-p">
            The open-source core makes the developer experience credible. Hosted plans add team operations,
            observability, key lifecycle, and production support.
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? "pc pc-featured" : "pc"} key={plan.tier}>
              {plan.featured && <div className="pc-badge">Best for early teams</div>}
              <div className="pc-tier">{plan.tier}</div>
              <div className="pc-price">
                {plan.price}
                {plan.period && <span className="pc-period">{plan.period}</span>}
              </div>
              <div className="pc-verif">{plan.verifs}</div>
              <ul className="pc-features">
                {plan.features.map((feature) => (
                  <li className="pc-feature-item" key={feature}>
                    <span className="pc-check">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a className={plan.featured ? "pc-btn pc-btn-featured" : "pc-btn"} href="#sandbox">
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

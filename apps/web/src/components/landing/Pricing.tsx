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
    tier: "Free",
    price: "$0",
    period: "/mo",
    verifs: "500 verifications/mo",
    features: ["Local SQLite audit log", "3 behavioral guards", "CLI simulator", "Community support"],
    cta: "Get started",
  },
  {
    tier: "Personal",
    price: "$20",
    period: "/mo",
    verifs: "5,000 verifications/mo",
    features: ["All Free features", "10 behavioral guards", "OpenAI + Anthropic adapters", "Email support"],
    cta: "Get started",
  },
  {
    tier: "Pro",
    price: "$50",
    period: "/mo",
    verifs: "20,000 verifications/mo",
    features: ["All Personal features", "MCP server integration", "Budget reporting API", "API key management", "Priority support"],
    cta: "Start free trial",
    featured: true,
  },
  {
    tier: "Advanced",
    price: "$99",
    period: "/mo",
    verifs: "100,000 verifications/mo",
    features: ["All Pro features", "LangChain toolkit adapter", "Custom blocked patterns", "SLA 99.9%", "Slack support"],
    cta: "Get started",
  },
  {
    tier: "Enterprise",
    price: "Custom",
    verifs: "Unlimited verifications",
    features: ["All Advanced features", "On-premise deployment", "Custom guard development", "Dedicated SLA", "24/7 support"],
    cta: "Contact sales",
  },
];

export function Pricing() {
  return (
    <section className="section divider" id="pricing">
      <div className="section-inner">
        <p className="eyebrow-label">Pricing</p>
        <h2 className="section-h2">{"Simple. Transparent. Scalable."}</h2>
        <p className="section-p" style={{ maxWidth: 480 }}>
          {"Start free. Scale as your agents grow. No hidden fees."}
        </p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? "pc pc-featured" : "pc"} key={plan.tier}>
              {plan.featured && <div className="pc-badge">Most Popular</div>}
              <div className="pc-tier">{plan.tier}</div>
              <div className="pc-price">
                {plan.price}
                {plan.period && <span className="pc-period">{plan.period}</span>}
              </div>
              <div className="pc-verif">{plan.verifs}</div>
              <ul className="pc-features">
                {plan.features.map((f) => (
                  <li className="pc-feature-item" key={f}>
                    <span className="pc-check">+</span>
                    {f}
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

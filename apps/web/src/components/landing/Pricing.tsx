const plans = [
  { tier: "Free", price: "£0/mo", verifs: "0-500 verifications" },
  { tier: "Personal", price: "£20/mo", verifs: "5,000 verifications" },
  { tier: "Pro", price: "£50/mo", verifs: "20,000 verifications" },
  { tier: "Advanced", price: "£99/mo", verifs: "100,000 verifications" },
  { tier: "Enterprise", price: "Custom", verifs: "Unlimited with SLA" },
];

export function Pricing() {
  return (
    <section className="section divider" id="pricing">
      <div className="section-inner">
        <p className="eyebrow-label">Pricing</p>
        <h2 className="section-h2">Simple. Transparent. Scalable.</h2>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className="pc" key={plan.tier}>
              <div className="pc-tier">{plan.tier}</div>
              <div className="pc-price">{plan.price}</div>
              <div className="pc-verif">{plan.verifs}</div>
              <a className="pc-btn" href="#sandbox">
                Get started
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

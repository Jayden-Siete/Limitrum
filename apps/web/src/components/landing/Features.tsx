const features = [
  "Domain allowlisting",
  "Budget caps",
  "Loop detection",
  "Syscall protection",
  "Full audit trail",
  "Out-of-band kernel",
];

export function Features() {
  return (
    <section className="section divider" id="features">
      <div className="section-inner">
        <p className="eyebrow-label">Capabilities</p>
        <h2 className="section-h2">Every guard your CISO has been asking for.</h2>
        <div className="features-grid">
          {features.map((feature) => (
            <article className="feat" key={feature}>
              <div className="feat-h">{feature}</div>
              <div className="feat-p">
                Deterministic enforcement and auditable policy decisions designed for enterprise-grade
                autonomous systems.
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

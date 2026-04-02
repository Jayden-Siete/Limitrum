export function CtaBlock() {
  return (
    <section className="cta-block section divider">
      <div className="section-inner cta-inner">
        <div className="cta-eyebrow">
          <span className="eyebrow-dot" />
          Production-ready. Open source. MIT licensed.
        </div>
        <h2 className="cta-h2">Stop trusting. Start enforcing.</h2>
        <p className="cta-sub">
          Every autonomous agent deserves a deterministic safety layer. Deploy Limitrum in 3 lines.
          No infrastructure rewrite required.
        </p>
        <div className="cta-actions">
          <a className="btn-lg btn-white" href="#sandbox">
            Try the sandbox
          </a>
          <a
            className="btn-lg btn-outline"
            href="https://github.com/Jayden-Siete/Limitrum"
            rel="noopener noreferrer"
            target="_blank"
          >
            View on GitHub
          </a>
        </div>
        <div className="cta-install">
          <span className="prompt">$</span>
          <span>pnpm add @limitrum/sdk</span>
        </div>
      </div>
    </section>
  );
}

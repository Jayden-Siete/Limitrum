export function CtaBlock() {
  return (
    <section className="cta-block section">
      <div className="section-inner cta-inner">
        <div className="cta-panel">
          <div className="cta-logo-mark" aria-hidden="true">
            <img alt="" src="/cta-logo-mark.png" />
          </div>
          <div>
            <div className="cta-eyebrow">
              <span className="eyebrow-dot" />
              Production-ready path
            </div>
            <h2 className="cta-h2">Ship agents with a hard boundary.</h2>
            <p className="cta-sub">
              Wrap high-risk tool calls, define the policy once, and make every intent auditable before it can touch
              money, data, infrastructure, or external APIs.
            </p>
          </div>
          <div className="cta-side">
            <div className="cta-install">
              <span className="prompt">$</span>
              <span>pnpm add @limitrum/sdk</span>
            </div>
            <div className="cta-actions">
              <a className="btn-lg btn-white" href="#sandbox">
                Open sandbox
              </a>
              <a
                className="btn-lg btn-outline"
                href="https://github.com/Jayden-Siete/Limitrum"
                rel="noopener noreferrer"
                target="_blank"
              >
                View GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

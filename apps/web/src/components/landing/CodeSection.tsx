type CodeSectionProps = {
  termLines: { type: string; text: string }[];
};

export function CodeSection({ termLines }: CodeSectionProps) {
  return (
    <section className="code-section section" id="code">
      <div className="section-inner">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow-label">Integration</p>
            <h2 className="section-h2">A few lines between intent and execution.</h2>
          </div>
          <p className="section-p">
            Limitrum is designed for developers who already have agents. Wrap the tool boundary and let the kernel
            return a deterministic verdict before the action runs.
          </p>
        </div>

        <div className="code-grid">
          <div className="vscode">
            <div className="vs-titlebar">
              <span className="stb-dot stb-red" />
              <span className="stb-dot stb-yellow" />
              <span className="stb-dot stb-green" />
              <span className="stb-title">agent.ts</span>
            </div>
            <pre className="vs-body">{`import { LimitrumGuard } from '@limitrum/sdk'

const guard = new LimitrumGuard({ policy: './limitrum.config.ts' })

const intent = {
  agentId: 'billing-agent-v2',
  action: 'stripe.createCharge',
  target: 'api.stripe.com/v1/charges',
  estimatedCostUsd: 50
}

const verdict = await guard.verify(intent)
if (!verdict.allowed) throw new Error(verdict.reason)

return stripe.charges.create(payload)`}</pre>
          </div>

          <div className="term">
            <div className="term-bar">
              <span className="stb-dot stb-red" />
              <span className="stb-dot stb-yellow" />
              <span className="stb-dot stb-green" />
              <span className="term-title">kernel output / live</span>
            </div>
            <div className="term-body">
              {termLines.map((line, idx) => (
                <span className={`tl ${line.type ? `tl-${line.type}` : ""}`} key={`${line.text}-${idx}`}>
                  {line.text || "\u00A0"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

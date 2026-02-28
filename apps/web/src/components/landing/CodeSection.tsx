type CodeSectionProps = {
  termLines: { type: string; text: string }[];
};

export function CodeSection({ termLines }: CodeSectionProps) {
  return (
    <section className="code-section section divider" id="code">
      <div className="section-inner">
        <p className="eyebrow-label">Integration</p>
        <h2 className="section-h2">5 lines between you and absolute safety.</h2>

        <div className="code-grid">
          <div className="vscode">
            <div className="vs-titlebar">
              <span className="stb-dot stb-red" />
              <span className="stb-dot stb-yellow" />
              <span className="stb-dot stb-green" />
              <span className="stb-title">agent.ts</span>
            </div>
            <pre className="vs-body">{`import { LimitrumGuard } from '@limitrum/sdk'
const guard = new LimitrumGuard()
const intent = { action: 'fetch', target: url, estimatedCostUsd: cost }
const verdict = guard.verify(intent)
if (!verdict.allowed) throw new Error(verdict.reason)`}</pre>
          </div>

          <div className="term">
            <div className="term-bar">
              <span className="stb-dot stb-red" />
              <span className="stb-dot stb-yellow" />
              <span className="stb-dot stb-green" />
              <span className="term-title">kernel output · real-time</span>
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

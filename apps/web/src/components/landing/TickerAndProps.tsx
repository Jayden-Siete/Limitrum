const tickerItems = [
  "BLOCK stripe.charge($8,400) / budget.cap / 18ms",
  "BLOCK loop_detected / 52 repeats / 1ms",
  "ALLOW openai.chat.completions / provider.ok / 14ms",
  "BLOCK fetch(api.unknown-exfil.io) / domain.not_allowed / 9ms",
  "ALLOW github.createIssue / non_destructive / 12ms",
  "BLOCK spawn_process('/bin/sh') / syscall.denylist / 2ms",
];

const propsData = [
  {
    num: "01",
    title: "Deterministic by design",
    text: "Policies execute outside the LLM path, so prompts cannot negotiate with enforcement.",
  },
  {
    num: "02",
    title: "Built for real agents",
    text: "Budget, rate, domain, syscall, destructive action, and audit policies ship together.",
  },
  {
    num: "03",
    title: "Operational proof",
    text: "Every verdict is logged with reason, latency, policy hash, and agent identity.",
  },
];

export function TickerAndProps() {
  return (
    <>
      <div className="ticker trust-band" aria-hidden="true">
        <span>OPENAI AGENTS</span>
        <span>ANTHROPIC TOOLS</span>
        <span>LANGCHAIN</span>
        <span>MCP SERVERS</span>
        <span>VERCEL AI SDK</span>
      </div>
      <div className="ticker verdict-ticker" aria-hidden="true">
        <div className="ticker-track">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span className="t-item" key={`${item}-${idx}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="section proof-section fundora-proof">
        <div className="section-inner">
          <div className="props-bar">
            {propsData.map((prop) => (
              <article className="prop" key={prop.num}>
                <span className="prop-num">{prop.num}</span>
                <div className="prop-h">{prop.title}</div>
                <div className="prop-p">{prop.text}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

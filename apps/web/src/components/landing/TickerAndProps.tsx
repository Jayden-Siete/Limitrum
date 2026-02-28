const tickerItems = [
  'BLOCKED stripe.createCharge($8,400) — budget exceeded · 18ms',
  "BLOCKED loop_detected — 52 iterations / 9s · 1ms",
  "ALLOWED openai.chat.completions.create — compliant · 14ms",
  'BLOCKED fetch("api.unknown-exfil.io") — domain not whitelisted · 9ms',
  "ALLOWED github.createIssue — api.github.com whitelisted · 12ms",
  'BLOCKED spawn_process("/bin/sh") — syscall denied · 2ms',
];

const propsData = [
  {
    num: "01",
    title: "Deterministic enforcement",
    text: "The Policy Kernel runs out-of-band. No LLM can override it.",
  },
  {
    num: "02",
    title: "24ms average latency",
    text: "Policy checks happen in under 24ms on average. Security stays fast.",
  },
  {
    num: "03",
    title: "3-line integration",
    text: "Install the SDK, define policy, wrap actions. No infrastructure rewrite.",
  },
];

export function TickerAndProps() {
  return (
    <>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span className="t-item" key={`${item}-${idx}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="section divider">
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

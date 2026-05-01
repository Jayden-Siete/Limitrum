import { useState } from 'react';
import { Play, CheckCircle, XCircle, Terminal, FileCode, Activity } from 'lucide-react';

type GuardResult = { name: string; status: 'pass' | 'fail'; detail: string };

const scenarios = [
  {
    name: 'Stripe Payment',
    intent: { agentId: 'billing-agent', action: 'stripe.createCharge', target: 'api.stripe.com', cost: 50 },
    results: [
      { name: 'Budget Cap', status: 'pass' as const, detail: '$3.20 / $500.00' },
      { name: 'Domain Allowlist', status: 'pass' as const, detail: 'api.stripe.com → allowed' },
      { name: 'Rate Limit', status: 'pass' as const, detail: '12 req / 60s window' },
      { name: 'Syscall Guard', status: 'pass' as const, detail: 'no system calls detected' },
      { name: 'Data Exfiltration', status: 'pass' as const, detail: 'no outbound data flow' },
    ] as GuardResult[],
    verdict: 'ALLOWED' as const,
    verdictId: 'ver_8x9k2m1p',
  },
  {
    name: 'Suspicious Shell',
    intent: { agentId: 'ops-agent', action: 'spawn_process', target: 'local.syscall', cost: 0 },
    results: [
      { name: 'Budget Cap', status: 'pass' as const, detail: '$0.00 / $500.00' },
      { name: 'Domain Allowlist', status: 'pass' as const, detail: 'local.syscall → internal' },
      { name: 'Rate Limit', status: 'pass' as const, detail: '2 req / 60s window' },
      { name: 'Syscall Guard', status: 'fail' as const, detail: 'BLOCKED: spawn_process detected' },
      { name: 'Data Exfiltration', status: 'pass' as const, detail: 'no outbound data flow' },
    ] as GuardResult[],
    verdict: 'BLOCKED' as const,
    verdictId: 'ver_2n4q8w5z',
  },
  {
    name: 'Overspend Attempt',
    intent: { agentId: 'marketing-agent', action: 'openai.chat.create', target: 'api.openai.com', cost: 600 },
    results: [
      { name: 'Budget Cap', status: 'fail' as const, detail: 'BLOCKED: $503.20 + $600 > $500.00' },
      { name: 'Domain Allowlist', status: 'pass' as const, detail: 'api.openai.com → allowed' },
      { name: 'Rate Limit', status: 'pass' as const, detail: '45 req / 60s window' },
      { name: 'Syscall Guard', status: 'pass' as const, detail: 'no system calls detected' },
      { name: 'Data Exfiltration', status: 'pass' as const, detail: 'no outbound data flow' },
    ] as GuardResult[],
    verdict: 'BLOCKED' as const,
    verdictId: 'ver_7m3p9k2x',
  },
];

export default function DemoSection() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [showVerdict, setShowVerdict] = useState(false);

  const scenario = scenarios[activeScenario];

  const runDemo = () => {
    setRunning(true);
    setStep(-1);
    setShowVerdict(false);

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= scenario.results.length) {
        clearInterval(interval);
        setShowVerdict(true);
        setRunning(false);
        return;
      }
      setStep(currentStep);
      currentStep++;
    }, 600);
  };

  const switchScenario = (idx: number) => {
    setActiveScenario(idx);
    setRunning(false);
    setStep(-1);
    setShowVerdict(false);
  };

  return (
    <section id="demo" className="relative section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-limitrum-steel font-medium mb-4">
            Live Demo
          </span>
          <h2 className="heading-lg mb-6">
            See It in <span className="text-gradient">Action</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Run real intent verification scenarios. Watch every guard check execute in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {scenarios.map((s, i) => (
                <button
                  key={i}
                  onClick={() => switchScenario(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    activeScenario === i
                      ? 'border-limitrum-steel/40 bg-limitrum-steel/5'
                      : 'border-border hover:border-limitrum-steel/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      s.verdict === 'ALLOWED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {s.verdict === 'ALLOWED' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.intent.action}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={runDemo}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm"
            >
              {running ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Verification
                </>
              )}
            </button>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <Terminal className="w-4 h-4 text-muted-foreground ml-2" />
                <span className="text-xs text-muted-foreground font-mono">limitrum verify</span>
              </div>

              <div className="p-5 font-mono text-sm min-h-[340px]">
                {/* Intent block */}
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <FileCode className="w-3 h-3" />
                    Intent
                  </div>
                  <div className="text-xs space-y-1">
                    <div><span className="text-limitrum-steel-light">agentId:</span> <span className="text-green-400">&quot;{scenario.intent.agentId}&quot;</span></div>
                    <div><span className="text-limitrum-steel-light">action:</span> <span className="text-green-400">&quot;{scenario.intent.action}&quot;</span></div>
                    <div><span className="text-limitrum-steel-light">target:</span> <span className="text-green-400">&quot;{scenario.intent.target}&quot;</span></div>
                    <div><span className="text-limitrum-steel-light">cost:</span> <span className="text-limitrum-accent">${scenario.intent.cost}</span></div>
                  </div>
                </div>

                {/* Guard checks */}
                <div className="space-y-1.5">
                  {scenario.results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 transition-all duration-300"
                      style={{
                        opacity: step >= i ? 1 : 0.2,
                        transform: step >= i ? 'translateX(0)' : 'translateX(-8px)',
                      }}
                    >
                      {step >= i ? (
                        result.status === 'pass' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${result.status === 'fail' ? 'text-red-400' : 'text-limitrum-steel-light'}`}>
                        {result.name}: {result.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Verdict */}
                {showVerdict && (
                  <div className="mt-4 pt-4 border-t border-border animate-in">
                    <div className={`text-sm font-bold ${scenario.verdict === 'ALLOWED' ? 'text-green-400' : 'text-red-400'}`}>
                      VERDICT: {scenario.verdict}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{scenario.verdictId} · latency: 4.2ms</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Shield, Zap, Lock, Github } from 'lucide-react';

const terminalLines = [
  { text: '$ npm install @limitrum/sdk', type: 'cmd', delay: 0 },
  { text: '', type: 'empty', delay: 0.5 },
  { text: 'added 3 packages in 2s', type: 'success', delay: 0.8 },
  { text: '', type: 'empty', delay: 1.0 },
  { text: '$ cat guard-policy.yaml', type: 'cmd', delay: 1.2 },
  { text: 'budget:', type: 'code', delay: 1.5 },
  { text: '  daily_max_usd: 500', type: 'code', delay: 1.7 },
  { text: 'domains:', type: 'code', delay: 1.9 },
  { text: '  allowlist:', type: 'code', delay: 2.1 },
  { text: '    - api.openai.com', type: 'code', delay: 2.3 },
  { text: '    - api.stripe.com', type: 'code', delay: 2.5 },
  { text: 'guards:', type: 'code', delay: 2.7 },
  { text: '  syscall: block', type: 'code', delay: 2.9 },
  { text: '  exfiltration: block', type: 'code', delay: 3.1 },
  { text: '', type: 'empty', delay: 3.3 },
  { text: '$ limitrum verify-intent --agent billing-agent', type: 'cmd', delay: 3.6 },
  { text: '', type: 'empty', delay: 4.0 },
  { text: '✓ budget check   $3.20 / $500.00', type: 'check', delay: 4.3 },
  { text: '✓ domain check   api.stripe.com → allowed', type: 'check', delay: 4.6 },
  { text: '✓ rate limit     12 req / 60s', type: 'check', delay: 4.9 },
  { text: '✓ syscall guard   no system calls', type: 'check', delay: 5.2 },
  { text: '✓ prompt injection  clean', type: 'check', delay: 5.5 },
  { text: '', type: 'empty', delay: 5.8 },
  { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'sep', delay: 6.0 },
  { text: 'VERDICT: ALLOWED    latency: 4.2ms', type: 'allowed', delay: 6.2 },
  { text: 'verdictId: ver_8x9k2m1p', type: 'result', delay: 6.5 },
  { text: '', type: 'empty', delay: 6.8 },
  { text: '$ _', type: 'prompt', delay: 7.0 },
];

function getLineStyle(type: string) {
  switch (type) {
    case 'cmd': return 'text-foreground font-semibold';
    case 'success': return 'text-green-500';
    case 'code': return 'text-muted-foreground pl-4';
    case 'check': return 'text-limitrum-steel-light pl-2';
    case 'sep': return 'text-border';
    case 'allowed': return 'text-green-400 font-bold';
    case 'result': return 'text-muted-foreground pl-2 text-xs';
    case 'prompt': return 'text-foreground';
    default: return 'text-muted-foreground';
  }
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleLines, setVisibleLines] = useState<number>(-1);
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    terminalLines.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(i);
        if (i === terminalLines.length - 1) {
          setCursorBlink(true);
        }
      }, line.delay * 1000);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
    >
      <div className="relative z-10 w-full section-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-limitrum-steel/10 border border-limitrum-steel/20 text-limitrum-steel text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Enforcement-first Runtime Control
            </div>

            <h1 className="heading-xl mb-6">
              The Policy Kernel for{' '}
              <span className="text-gradient">Autonomous AI Agents</span>
            </h1>

            <p className="body-lg text-muted-foreground mb-8">
              Every action checked. Every decision logged. Every risk controlled. Limitrum sits between agent intent and real-world execution.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-semibold rounded-xl hover:opacity-90 transition-all duration-300 text-sm"
              >
                Try the Sandbox
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/Jayden-Siete/Limitrum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-all duration-300 text-sm"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-limitrum-steel" />
                <div>
                  <div className="text-lg font-display font-bold">9</div>
                  <div className="text-xs text-muted-foreground">Policy Guards</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-limitrum-steel" />
                <div>
                  <div className="text-lg font-display font-bold">&lt;5ms</div>
                  <div className="text-xs text-muted-foreground">Verification</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-limitrum-steel" />
                <div>
                  <div className="text-lg font-display font-bold">100%</div>
                  <div className="text-xs text-muted-foreground">Deterministic</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Floating windows like Cursor */}
          <div className="relative h-[520px] hidden lg:block">
            {/* Main terminal window */}
            <div className="absolute top-0 left-0 w-[480px] bg-card rounded-xl border border-border shadow-2xl overflow-hidden z-20">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">limitrum-cli</span>
              </div>
              <div className="p-4 font-mono text-xs min-h-[280px] leading-relaxed">
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    className={`${getLineStyle(line.type)} transition-opacity duration-200`}
                    style={{ opacity: i <= visibleLines ? 1 : 0 }}
                  >
                    {line.text}
                  </div>
                ))}
                <div className="flex items-center mt-1" style={{ opacity: visibleLines >= terminalLines.length - 1 ? 1 : 0 }}>
                  <span className="text-foreground mr-2">$</span>
                  <span className={`w-2 h-4 bg-limitrum-steel ${cursorBlink ? 'animate-terminal-blink' : ''}`} />
                </div>
              </div>
            </div>

            {/* Small IDE window - floating behind */}
            <div className="absolute top-32 right-0 w-[340px] bg-card rounded-xl border border-border shadow-xl overflow-hidden z-10 animate-float">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[10px] text-muted-foreground font-mono">sdk.ts</span>
              </div>
              <div className="p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                <div><span className="text-limitrum-steel-light">import</span> {'{'} LimitrumGuard {'}'} <span className="text-limitrum-steel-light">from</span> <span className="text-green-400">&quot;@limitrum/sdk&quot;</span></div>
                <div className="mt-1"><span className="text-limitrum-steel-light">const</span> guard = <span className="text-limitrum-steel-light">new</span> <span className="text-foreground">LimitrumGuard</span>()</div>
                <div className="mt-2"><span className="text-limitrum-steel-light">const</span> verdict = <span className="text-limitrum-steel-light">await</span> guard.<span className="text-foreground">verify</span>({'{'}</div>
                <div className="pl-3 text-green-400">agentId: &quot;billing-agent&quot;</div>
                <div className="pl-3 text-green-400">action: &quot;stripe.createCharge&quot;</div>
                <div className="pl-3 text-green-400">estimatedCostUsd: <span className="text-limitrum-accent">50</span></div>
                <div>{'}'})</div>
                <div className="mt-1"><span className="text-limitrum-steel-light">if</span> (!verdict.allowed) <span className="text-limitrum-steel-light">throw new</span> <span className="text-foreground">Error</span>(...)</div>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute bottom-8 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border z-30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">guards active: 9/9</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

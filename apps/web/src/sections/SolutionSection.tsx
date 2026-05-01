import { useEffect, useRef } from 'react';
import { Send, Search, CheckCircle, ClipboardList, Play } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Intent',
    desc: 'Agent plans a sensitive tool call. The app packages the action, target, estimated cost, and metadata into an intent object.',
    icon: Send,
  },
  {
    num: '02',
    title: 'Verify',
    desc: 'LimitrumGuard receives the intent and loads the active policy. Every guard runs in sequence against the intent.',
    icon: Search,
  },
  {
    num: '03',
    title: 'Decide',
    desc: 'Each guard evaluates the intent against its rule set. If any guard fails, the verdict is BLOCKED with a specific reason.',
    icon: CheckCircle,
  },
  {
    num: '04',
    title: 'Log',
    desc: 'The complete decision is written to the audit trail: intent, verdict, reason, timestamp — for compliance and debugging.',
    icon: ClipboardList,
  },
  {
    num: '05',
    title: 'Execute',
    desc: 'The application receives the verdict. Only if ALLOWED does the tool call proceed. If BLOCKED, execution halts immediately.',
    icon: Play,
  },
];

export default function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="solution" ref={sectionRef} className="relative section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-limitrum-steel font-medium mb-4">
            How It Works
          </span>
          <h2 className="heading-lg mb-6">
            Five Steps to{' '}
            <span className="text-gradient">Deterministic Safety</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Limitrum sits between agent intent and real-world execution. Every action is checked before it happens.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
          {steps.map((step, i) => (
            <div
              key={i}
              className="reveal opacity-0 glass-card dark:glass-card glass-card-light rounded-xl p-5 hover:border-limitrum-steel/40 transition-all duration-300 group"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-[2px] bg-border z-10" />
              )}
              <div className="text-3xl font-display font-bold text-limitrum-steel/20 mb-3 group-hover:text-limitrum-steel/40 transition-colors">
                {step.num}
              </div>
              <div className="w-10 h-10 rounded-lg bg-limitrum-steel/10 flex items-center justify-center text-limitrum-steel mb-3 group-hover:bg-limitrum-steel/20 transition-all">
                <step.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="reveal opacity-0 max-w-3xl mx-auto">
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">sdk-example.ts</span>
            </div>
            <div className="p-6 font-mono text-sm overflow-x-auto">
              <pre className="text-muted-foreground">
<span className="text-limitrum-steel-light">import</span> {'{'} LimitrumGuard {'}'} <span className="text-limitrum-steel-light">from</span> <span className="text-green-400">&quot;@limitrum/sdk&quot;</span>

<span className="text-limitrum-steel-light">const</span> guard = <span className="text-limitrum-steel-light">new</span> <span className="text-foreground">LimitrumGuard</span>()

<span className="text-limitrum-steel-light">const</span> verdict = <span className="text-limitrum-steel-light">await</span> guard.<span className="text-foreground">verify</span>({'{'}
  agentId: <span className="text-green-400">&quot;billing-agent&quot;</span>,
  action: <span className="text-green-400">&quot;stripe.createCharge&quot;</span>,
  target: <span className="text-green-400">&quot;api.stripe.com/v1/charges&quot;</span>,
  estimatedCostUsd: <span className="text-limitrum-accent">50</span>,
{'}'})

<span className="text-limitrum-steel-light">if</span> (!verdict.allowed) <span className="text-limitrum-steel-light">throw new</span> <span className="text-foreground">Error</span>(verdict.reason)
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

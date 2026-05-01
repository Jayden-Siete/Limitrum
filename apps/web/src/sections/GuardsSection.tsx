import { useEffect, useRef } from 'react';
import {
  DollarSign, Globe, Gauge, RefreshCw,
  Shield, Trash2, Lock, MessageSquareWarning, PenTool
} from 'lucide-react';

const guards = [
  { name: 'Budget Caps', desc: 'Enforce daily and per-action spending limits on LLM usage and third-party services.', icon: DollarSign },
  { name: 'Domain Allowlists', desc: 'Block API calls to untrusted domains. Only pre-approved endpoints can receive requests.', icon: Globe },
  { name: 'Rate Limits', desc: 'Prevent abuse by throttling the number of actions an agent can take per minute or hour.', icon: Gauge },
  { name: 'Loop Detection', desc: 'Detect and terminate infinite loops or runaway retry patterns that could drain budgets.', icon: RefreshCw },
  { name: 'Syscall Protection', desc: 'Block dangerous system calls like shell execution, process spawning, and file mutations.', icon: Shield },
  { name: 'Destructive Actions', desc: 'Prevent data deletion, schema drops, or irreversible mutations without approval.', icon: Trash2 },
  { name: 'Data Exfiltration', desc: 'Monitor and block attempts to send sensitive data to unauthorized external destinations.', icon: Lock },
  { name: 'Prompt Injection', desc: 'Detect known prompt injection patterns and jailbreak attempts in incoming messages.', icon: MessageSquareWarning },
  { name: 'Custom Patterns', desc: 'Define your own regex or semantic rules for actions specific to your domain.', icon: PenTool },
];

export default function GuardsSection() {
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
      { threshold: 0.05 }
    );

    const elements = sectionRef.current?.querySelectorAll('.reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="guards" ref={sectionRef} className="relative section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-limitrum-steel font-medium mb-4">
            Policy Guards
          </span>
          <h2 className="heading-lg mb-6">
            Nine Layers of{' '}
            <span className="text-gradient">Deterministic Protection</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Every intent passes through a configurable pipeline. Each guard returns a clear verdict. No ambiguity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {guards.map((guard, i) => (
            <div
              key={i}
              className="reveal opacity-0 glass-card dark:glass-card glass-card-light rounded-xl p-6 hover:border-limitrum-steel/40 hover:bg-limitrum-steel/5 transition-all duration-300 group"
              style={{ animationDelay: `${(i % 3) * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-limitrum-steel/10 flex items-center justify-center text-limitrum-steel group-hover:bg-limitrum-steel/20 group-hover:text-limitrum-steel-light transition-all duration-300">
                  <guard.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1.5 group-hover:text-limitrum-steel-light transition-colors">
                    {guard.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {guard.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

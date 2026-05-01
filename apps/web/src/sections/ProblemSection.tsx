import { useEffect, useRef } from 'react';
import { AlertTriangle, Eye, CreditCard, Infinity } from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    title: 'Prompts are not enforceable',
    desc: 'You can ask an agent to be careful, but there is no mechanism to enforce limits at runtime. A clever prompt injection bypasses all your instructions.',
  },
  {
    icon: Eye,
    title: 'Observability only tells you what happened',
    desc: 'Existing tools log actions after execution. The damage is already done. Overspent budgets, leaked data, executed shell commands — logged, not prevented.',
  },
  {
    icon: CreditCard,
    title: 'Agents can spend money and execute code',
    desc: 'A single unchecked intent can trigger a financial, legal, or security catastrophe. Agents now have access to APIs, databases, infrastructure, and customer data.',
  },
  {
    icon: Infinity,
    title: 'No deterministic boundary exists',
    desc: 'Engineering teams need a simple way to let agents act without giving them unconditional power. Every agent deployment today is essentially unbounded.',
  },
];

const stats = [
  { value: '$8B', label: 'AI Agent Market 2025' },
  { value: '23%', label: 'Enterprises Scaling Agents' },
  { value: '41%', label: 'Annual Growth Rate' },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem" ref={sectionRef} className="relative section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-limitrum-steel font-medium mb-4">
            The Problem
          </span>
          <h2 className="heading-lg mb-6">
            AI Agents Are Moving Into Operations<br />
            Without a <span className="text-gradient">Runtime Boundary</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            We now have powerful agents, but nothing like an operating system to manage them. Right now, prompts cannot be enforced, and current tools only monitor behavior after it happens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {problems.map((problem, i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="opacity-0 glass-card dark:glass-card glass-card-light rounded-xl p-6 hover:border-limitrum-steel/40 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-limitrum-steel/10 flex items-center justify-center text-limitrum-steel group-hover:bg-limitrum-steel/20 transition-all">
                  <problem.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-8 rounded-xl border border-border hover:border-limitrum-steel/30 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Open Source',
    price: 'Free',
    period: '',
    desc: 'Self-hosted SDK & local kernel. Community support.',
    features: ['TypeScript SDK', 'Local SQLite kernel', 'All 9 policy guards', 'Audit logs', 'Budget reports', 'Community support'],
    cta: 'Get Started',
    highlight: false,
    href: '#demo',
  },
  {
    name: 'Developer Cloud',
    price: '$49',
    period: '/month',
    desc: 'Hosted policy API for individual developers.',
    features: ['Everything in Open Source', 'Hosted policy API', '50K verifications/mo', 'API key lifecycle', 'Metrics dashboard', 'Email support'],
    cta: 'Start Free Trial',
    highlight: true,
    href: '#demo',
  },
  {
    name: 'Team',
    price: '$249',
    period: '/month',
    desc: 'For teams building production agents.',
    features: ['Everything in Developer Cloud', '500K verifications/mo', 'Shared team policies', 'SIEM export', 'Custom guard patterns', 'Priority support'],
    cta: 'Contact Sales',
    highlight: false,
    href: 'mailto:contact@limitrum.com?subject=Limitrum%20Team%20Plan',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'VPC, compliance, and dedicated support.',
    features: ['Everything in Team', 'VPC / On-prem deploy', 'SSO & SCIM', 'Custom SLA', 'Compliance reporting', 'Security review', 'Account manager'],
    cta: 'Contact Sales',
    highlight: false,
    href: 'mailto:contact@limitrum.com?subject=Limitrum%20Enterprise',
  },
];

export default function PricingSection() {
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
    <section id="pricing" ref={sectionRef} className="relative section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-limitrum-steel font-medium mb-4">
            Pricing
          </span>
          <h2 className="heading-lg mb-6">
            Open-Core with{' '}
            <span className="text-gradient">Hosted Cloud</span> & Enterprise
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with the open-source SDK. Upgrade when you need hosted reliability and team controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`reveal opacity-0 relative rounded-xl p-6 transition-all duration-300 ${
                tier.highlight
                  ? 'border-2 border-limitrum-steel/40 bg-limitrum-steel/5 hover:border-limitrum-steel/60'
                  : 'border border-border hover:border-limitrum-steel/20 bg-card'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-limitrum-steel text-background text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground text-lg">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-display font-bold text-foreground">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {tier.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-limitrum-steel flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`block w-full text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  tier.highlight
                    ? 'bg-foreground text-background hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

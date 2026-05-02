import { useEffect, useRef } from 'react';
import { ArrowRight, Github } from 'lucide-react';

export default function CTASection() {
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
      { threshold: 0.2 }
    );

    const el = sectionRef.current?.querySelector('.cta-content');
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative section-padding overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-limitrum-steel/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="cta-content opacity-0 text-center">
          <h2 className="heading-xl mb-6">
            AI Agents Need a Kernel,<br />
            <span className="text-gradient">Not Just a Prompt</span>
          </h2>
          <p className="body-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Limitrum gives builders the confidence to let agents act in the real world while keeping money, data, systems, and auditability under deterministic control.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:opacity-90 transition-all text-lg"
            >
              Try the Sandbox
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Jayden-Siete/Limitrum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-border text-foreground font-semibold rounded-xl hover:border-limitrum-steel/40 hover:bg-limitrum-steel/5 transition-all text-lg"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>

          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground/60 mb-5 uppercase tracking-widest">Built with</p>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground/40 text-sm">
              <span>TypeScript</span>
              <span>Hono</span>
              <span>SQLite</span>
              <span>Next.js</span>
              <span>Deterministic</span>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

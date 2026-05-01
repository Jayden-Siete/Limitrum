import { useEffect } from 'react';
import Lenis from 'lenis';
import { ThemeProvider } from './hooks/useTheme';
import ParticleBackground from './sections/ParticleBackground';
import Navigation from './sections/Navigation';
import HeroSection from './sections/HeroSection';
import ProblemSection from './sections/ProblemSection';
import SolutionSection from './sections/SolutionSection';
import DemoSection from './sections/DemoSection';
import GuardsSection from './sections/GuardsSection';
import PricingSection from './sections/PricingSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

function AppContent() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <ParticleBackground />
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <DemoSection />
        <GuardsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

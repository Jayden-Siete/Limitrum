import { Github, Twitter, Linkedin } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="relative border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={theme === 'dark' ? '/assets/logo-white.png' : '/assets/logo-dark.png'}
                alt="Limitrum"
                className="h-8 w-auto"
              />
              <span className="font-display font-semibold text-foreground text-lg">Limitrum</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The policy kernel for autonomous AI agents. Enforcement-first runtime control.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solution</a>
              </li>
              <li>
                <a href="#guards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guards</a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sandbox</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://github.com/Jayden-Siete/Limitrum#readme" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              </li>
              <li>
                <a href="https://github.com/Jayden-Siete/Limitrum/tree/dev/packages/sdk" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</a>
              </li>
              <li>
                <a href="https://github.com/Jayden-Siete/Limitrum" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              </li>
              <li>
                <a href="https://github.com/Jayden-Siete/Limitrum/blob/dev/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Connect</h4>
            <div className="flex gap-3">
              <a href="https://github.com/Jayden-Siete/Limitrum" target="_blank" rel="noopener noreferrer" aria-label="Limitrum on GitHub" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-limitrum-steel/10 transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://x.com/limitrum" target="_blank" rel="noopener noreferrer" aria-label="Limitrum on X" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-limitrum-steel/10 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/company/limitrum" target="_blank" rel="noopener noreferrer" aria-label="Limitrum on LinkedIn" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-limitrum-steel/10 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Limitrum. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="mailto:contact@limitrum.com?subject=Limitrum%20Privacy" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Privacy</a>
            <a href="mailto:contact@limitrum.com?subject=Limitrum%20Terms" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

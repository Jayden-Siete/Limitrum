"use client";

import { GitBranch, Moon, Sun } from "lucide-react";

type NavProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  logoSrc?: string;
};

export function Nav({ theme, onToggleTheme, logoSrc }: NavProps) {
  const fallbackLogo = theme === "dark" ? "/limitrum-logo-white.png" : "/limitrum-logo-dark.png";
  const ThemeIcon = theme === "dark" ? Moon : Sun;

  return (
    <nav className="nav">
      <a className="nav-logo" href="#top" aria-label="Limitrum home">
        <img src={logoSrc ?? fallbackLogo} alt="Limitrum" />
        <span>Limitrum</span>
      </a>
      <div className="nav-center">
        <a href="#sandbox">Sandbox</a>
        <a href="#code">Integration</a>
        <a href="#features">Security</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div className="nav-right">
        <button className="theme-toggle" onClick={onToggleTheme} type="button" aria-label="Toggle theme">
          <ThemeIcon aria-hidden="true" size={16} />
        </button>
        <a
          className="btn-nav-secondary nav-icon-link"
          href="https://github.com/Jayden-Siete/Limitrum"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Limitrum on GitHub"
        >
          <GitBranch aria-hidden="true" size={16} />
          <span>GitHub</span>
        </a>
        <a className="btn-nav-primary" href="#sandbox">
          Open sandbox
        </a>
      </div>
    </nav>
  );
}

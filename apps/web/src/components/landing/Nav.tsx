"use client";

import { GitBranch, Moon, ShieldCheck, Sun } from "lucide-react";

type NavProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  logoSrc?: string;
};

export function Nav({ theme, onToggleTheme, logoSrc }: NavProps) {
  const ThemeIcon = theme === "dark" ? Moon : Sun;

  return (
    <nav className="nav">
      <a className="nav-logo fundora-logo" href="#top" aria-label="Limitrum home">
        {logoSrc ? <img src={logoSrc} alt="Limitrum" /> : <ShieldCheck aria-hidden="true" size={25} strokeWidth={2.4} />}
        <span>Limitrum</span>
      </a>
      <div className="nav-center">
        <a href="#top">Home</a>
        <a href="#sandbox">Sandbox</a>
        <a href="#features">Security</a>
        <a href="#pricing">Pricing</a>
        <a href="#code">Docs</a>
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

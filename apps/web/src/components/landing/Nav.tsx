"use client";

type NavProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  logoSrc?: string;
};

export function Nav({ theme, onToggleTheme, logoSrc }: NavProps) {
  const fallbackLogo =
    theme === "dark" ? "/limitrum-logo-white.png" : "/limitrum-logo-dark.png";

  return (
    <nav className="nav">
      <a className="nav-logo" href="#top">
        <img src={logoSrc ?? fallbackLogo} alt="Limitrum" />
      </a>
      <div className="nav-center">
        <a href="#sandbox">Sandbox</a>
        <a href="#code">Integration</a>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div className="nav-right">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          type="button"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "◐" : "◑"}
        </button>
        <a className="btn-nav-secondary" href="https://github.com/Jayden-Siete/Limitrum" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a className="btn-nav-primary" href="#sandbox">
          Get started →
        </a>
      </div>
    </nav>
  );
}

const footerLinks = [
  { label: "GitHub", href: "https://github.com/Jayden-Siete/Limitrum", external: true },
  { label: "Docs", href: "#code", external: false },
  { label: "Sandbox", href: "#sandbox", external: false },
  { label: "Pricing", href: "#pricing", external: false },
  { label: "Security", href: "https://github.com/Jayden-Siete/Limitrum/blob/main/SECURITY.md", external: true },
  { label: "Contributing", href: "https://github.com/Jayden-Siete/Limitrum/blob/main/CONTRIBUTING.md", external: true },
  { label: "License (MIT)", href: "https://github.com/Jayden-Siete/Limitrum/blob/main/LICENSE", external: true },
];

type FooterProps = {
  theme?: "dark" | "light";
};

export function Footer({ theme = "dark" }: FooterProps) {
  const logoSrc = theme === "dark" ? "/limitrum-logo-white.png" : "/limitrum-logo-dark.png";
  return (
    <footer className="footer">
      <div className="section-inner footer-inner">
        <div className="footer-top">
          <a className="footer-logo" href="#top">
            <img alt="Limitrum" height={20} src={logoSrc} />
          </a>
          <nav className="footer-links">
            {footerLinks.map((link) => (
              <a
                className="footer-link"
                href={link.href}
                key={link.label}
                rel={link.external ? "noopener noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">
            {new Date().getFullYear()} Limitrum. MIT License. Built for the age of autonomous AI.
          </span>
          <span className="footer-badge">
            <span className="eyebrow-dot" style={{ width: 6, height: 6 }} />
            Open Beta
          </span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { motion } from "framer-motion";
import { Nav } from "./Nav";

type HeroProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  copied: boolean;
  onCopyInstall: () => void;
  logoSrc?: string;
  shellSrc?: string;
};

export function Hero({ theme, onToggleTheme, copied, onCopyInstall, logoSrc, shellSrc }: HeroProps) {
  return (
    <section className="hero section" id="top">
      <Nav theme={theme} onToggleTheme={onToggleTheme} logoSrc={logoSrc} />

      <div className="hero-eyebrow">
        <span className="eyebrow-dot" />
        Open Beta — The safety engine for autonomous AI systems
      </div>
      <h1 className="hero-h1">
        In a world of claws,
        <br />
        build a <em>shell.</em>
      </h1>
      <p className="hero-sub">The safety engine for autonomous systems.</p>
      <p className="hero-tagline">// The Guardian · Deterministic by design</p>

      <div className="install-bar">
        <div className="install-bar-cmd">
          <span className="prompt">$</span>
          <span>pnpm add @limitrum/sdk</span>
        </div>
        <button className="install-bar-copy" onClick={onCopyInstall} type="button">
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>

      <div className="hero-sub-ctas">
        <a className="btn-lg btn-white" href="#sandbox">
          Try the sandbox →
        </a>
        <a className="btn-lg btn-outline" href="#code">
          Read the docs
        </a>
      </div>

      <div className="hero-stage">
        <div className="stage-window">
          <div className="stage-titlebar">
            <span className="stb-dot stb-red" />
            <span className="stb-dot stb-yellow" />
            <span className="stb-dot stb-green" />
            <span className="stb-title">policy_kernel · agent:billing-agent-v2 · LIVE</span>
          </div>
          <div className="stage-body">
            <div className="anim-wrap">
              <motion.div
                animate={{ x: [0, 22, 0] }}
                className="claw"
                transition={{
                  duration: 3,
                  ease: [0.42, 0, 0.58, 1],
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <div className="claw-arm" key={idx} />
                ))}
              </motion.div>

              <div className="target-action">
                <span className="fn">delete_data</span>
                <span className="arg">("users/*")</span>
              </div>

              <motion.div
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.98, 1.04, 0.98] }}
                className="shell-guard"
                transition={{
                  duration: 2.2,
                  ease: [0.42, 0, 0.58, 1],
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <img className="shell-img" src={shellSrc ?? logoSrc ?? "/limitrum-logo-white.png"} alt="Limitrum Shell" />
                <div className="status-badge">Policy enforced.</div>
              </motion.div>

              <motion.div
                animate={{ opacity: [0.2, 1, 1, 0.2] }}
                className="verdict"
                transition={{
                  duration: 3,
                  ease: [0.42, 0, 0.58, 1],
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <div className="verdict-title">Intent Blocked.</div>
                <div className="verdict-sub">policy.data_deletion = false · 11ms</div>
              </motion.div>
            </div>
          </div>
          <div className="stage-footer">
            <span>Budget: $23.40 / $50.00 · Rate: 42/100 req·min⁻¹</span>
            <span className="stage-live">KERNEL ACTIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
}

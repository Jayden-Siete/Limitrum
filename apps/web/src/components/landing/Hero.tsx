"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "./Nav";

type HeroProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  copied: boolean;
  onCopyInstall: () => void;
  logoSrc?: string;
  shellSrc?: string;
};

type IntentFrame = {
  id: string;
  label: string;
  action: string;
  risk: string;
  verdict: "ALLOW" | "BLOCK";
  reason: string;
  latency: string;
  spend: string;
};

const intentFrames: IntentFrame[] = [
  {
    id: "01",
    label: "billing-agent",
    action: "stripe.refund(customer_482, $890)",
    risk: "High spend outside signed budget",
    verdict: "BLOCK",
    reason: "cost_cap.exceeded and approval missing",
    latency: "13ms",
    spend: "$0.00",
  },
  {
    id: "02",
    label: "research-agent",
    action: "fetch('https://vendor-docs.com/api')",
    risk: "Allowed domain, read-only network",
    verdict: "ALLOW",
    reason: "domain.allowlist and read_scope.valid",
    latency: "8ms",
    spend: "$0.02",
  },
  {
    id: "03",
    label: "ops-agent",
    action: "shell.exec('rm -rf /prod/cache')",
    risk: "Destructive syscall requested",
    verdict: "BLOCK",
    reason: "syscall.denylist matched destructive_fs",
    latency: "11ms",
    spend: "$0.00",
  },
];

export function Hero({ theme, onToggleTheme, copied, onCopyInstall, logoSrc, shellSrc }: HeroProps) {
  const [active, setActive] = useState(0);
  const frame = intentFrames[active];
  const isBlocked = frame.verdict === "BLOCK";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % intentFrames.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const auditRows = useMemo(
    () => [
      ["verify_intent", frame.latency],
      ["match_policy", isBlocked ? "deny" : "pass"],
      ["write_audit_log", "sha256:9f2c..."],
    ],
    [frame.latency, isBlocked],
  );

  return (
    <section className="hero section" id="top">
      <Nav theme={theme} onToggleTheme={onToggleTheme} logoSrc={logoSrc} />

      <div className="hero-grid section-inner">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Policy Kernel for autonomous AI agents
          </div>
          <h1 className="hero-h1">
            Govern every
            <br />
            AI <em>action.</em>
          </h1>
          <p className="hero-sub">
            Limitrum sits between intent and execution, verifying, constraining,
            and logging every action your agents take.
          </p>

          <div className="install-bar">
            <div className="install-bar-cmd">
              <span className="prompt">$</span>
              <span>pnpm add @limitrum/sdk</span>
            </div>
            <button className="install-bar-copy" onClick={onCopyInstall} type="button">
              {copied ? "copied" : "copy"}
            </button>
          </div>

          <div className="hero-sub-ctas">
            <a className="btn-lg btn-white" href="#sandbox">
              Get started
            </a>
            <a className="btn-lg btn-outline" href="#code">
              Read the docs
            </a>
          </div>

          <div className="trust-strip" aria-label="Limitrum value propositions">
            <span>Deterministic guardrails</span>
            <span>Runtime budgets</span>
            <span>Auditable decisions</span>
          </div>
        </div>

        <div className="hero-stage" aria-label="Animated Limitrum policy kernel">
          <div className="stage-window kernel-window">
            <div className="stage-titlebar">
              <span className="stb-dot stb-red" />
              <span className="stb-dot stb-yellow" />
              <span className="stb-dot stb-green" />
              <span className="stb-title">limitrum.kernel / live intent verification</span>
            </div>

            <div className="kernel-frame">
              <div className="intent-stack">
                {intentFrames.map((intent, index) => (
                  <button
                    className={`intent-card ${index === active ? "active" : ""}`}
                    key={intent.id}
                    onClick={() => setActive(index)}
                    type="button"
                  >
                    <span className="intent-id">{intent.id}</span>
                    <span className="intent-label">{intent.label}</span>
                    <span className="intent-action">{intent.action}</span>
                  </button>
                ))}
              </div>

              <div className="kernel-core-wrap">
                <motion.div
                  animate={{ rotate: 360 }}
                  className="kernel-orbit"
                  transition={{ duration: 14, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  animate={{ opacity: [0.25, 0.75, 0.25], scale: [0.96, 1.04, 0.96] }}
                  className="kernel-pulse"
                  transition={{ duration: 2.4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
                />
                <div className="kernel-core">
                  <img
                    className="kernel-logo"
                    src={shellSrc ?? logoSrc ?? (theme === "light" ? "/limitrum-logo-dark.png" : "/limitrum-logo-white.png")}
                    alt=""
                  />
                  <span>Policy Kernel</span>
                </div>
                <motion.div
                  animate={{ x: [-120, 120], opacity: [0, 1, 0] }}
                  className="kernel-scan"
                  transition={{ duration: 1.9, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
                />
              </div>

              <motion.div
                animate={{ y: [0, -3, 0] }}
                className={`verdict-panel ${isBlocked ? "blocked" : "allowed"}`}
                key={frame.id}
                transition={{ duration: 0.4 }}
              >
                <div className="verdict-kicker">Kernel verdict</div>
                <div className="verdict-title">{frame.verdict}</div>
                <div className="verdict-reason">{frame.reason}</div>
                <div className="verdict-meta">
                  <span>{frame.latency}</span>
                  <span>{frame.spend}</span>
                </div>
              </motion.div>
            </div>

            <div className="risk-band">
              <div>
                <span className="risk-label">Incoming risk</span>
                <strong>{frame.risk}</strong>
              </div>
              <div className="budget-meter">
                <span />
              </div>
            </div>

            <div className="audit-log">
              {auditRows.map(([name, value]) => (
                <div className="audit-row" key={name}>
                  <span>{name}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

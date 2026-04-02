"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Policy {
  id: string;
  agentId: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string;
  loopDetectionEnabled: number;
  syscallProtectionEnabled: number;
  destructiveActionsEnabled: number;
  dataExfilEnabled: number;
  promptInjectionEnabled: number;
}

interface AgentStatus {
  agentId: string;
  name: string;
  status: string;
  environment: string;
  hasPolicy: boolean;
  policyId: string | null;
  maxDailySpend: number | null;
  guardsEnabled: {
    loopDetection: boolean;
    syscallProtection: boolean;
    destructiveActions: boolean;
    dataExfil: boolean;
    promptInjection: boolean;
  } | null;
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // TODO: Connect to real API - GET /v1/agents/:id/status
    setTimeout(() => {
      setAgent({
        agentId: resolvedParams.id,
        name: "Sales Agent",
        status: "active",
        environment: "production",
        hasPolicy: true,
        policyId: "policy_abc123",
        maxDailySpend: 50,
        guardsEnabled: {
          loopDetection: true,
          syscallProtection: true,
          destructiveActions: true,
          dataExfil: true,
          promptInjection: false,
        },
      });
      setPolicy({
        id: "policy_abc123",
        agentId: resolvedParams.id,
        maxDailySpend: 50,
        perActionCap: 10,
        maxRatePerMinute: 30,
        allowedEndpoints: JSON.stringify(["api.stripe.com", "api.openai.com"]),
        loopDetectionEnabled: 1,
        syscallProtectionEnabled: 1,
        destructiveActionsEnabled: 1,
        dataExfilEnabled: 1,
        promptInjectionEnabled: 0,
      });
      setLoading(false);
    }, 500);
  }, [resolvedParams.id]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Connect to real API - PUT /v1/agents/:id/policy
    setTimeout(() => {
      setSaving(false);
      alert("Policy saved successfully!");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="agent-detail-page">
        <div className="loading">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="agent-detail-page">
        <div className="error">Agent not found</div>
      </div>
    );
  }

  const domains = policy ? JSON.parse(policy.allowedEndpoints) : [];

  return (
    <div className="agent-detail-page">
      <header className="page-header">
        <div className="header-content">
          <Link href="/dashboard/agents" className="back-link">← Back to Agents</Link>
          <h1>{agent.name}</h1>
          <p className="subtitle">Agent ID: {agent.agentId}</p>
        </div>
        <span className={`status-badge ${agent.status}`}>{agent.status}</span>
      </header>

      <div className="agent-info">
        <div className="info-card">
          <div className="info-label">Environment</div>
          <div className="info-value">{agent.environment}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Policy</div>
          <div className="info-value">{agent.hasPolicy ? "Configured" : "None"}</div>
        </div>
      </div>

      <section className="policy-editor">
        <h2>Policy Configuration</h2>

        <div className="policy-form">
          <div className="form-section">
            <h3>Budget Controls</h3>
            <div className="form-row">
              <label>
                Max Daily Spend (USD)
                <input
                  type="number"
                  value={policy?.maxDailySpend ?? 0}
                  onChange={(e) => setPolicy(p => p ? { ...p, maxDailySpend: Number(e.target.value) } : null)}
                />
              </label>
              <label>
                Per-Action Cap (USD)
                <input
                  type="number"
                  value={policy?.perActionCap ?? 0}
                  onChange={(e) => setPolicy(p => p ? { ...p, perActionCap: Number(e.target.value) } : null)}
                />
              </label>
              <label>
                Rate Limit (per minute)
                <input
                  type="number"
                  value={policy?.maxRatePerMinute ?? 0}
                  onChange={(e) => setPolicy(p => p ? { ...p, maxRatePerMinute: Number(e.target.value) } : null)}
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Domain Allowlist</h3>
            <div className="form-row">
              <label className="full-width">
                Allowed Endpoints (comma-separated)
                <input
                  type="text"
                  value={domains.join(", ")}
                  onChange={(e) => setPolicy(p => p ? { ...p, allowedEndpoints: JSON.stringify(e.target.value.split(",").map(s => s.trim()).filter(Boolean)) } : null)}
                  placeholder="api.stripe.com, api.openai.com"
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Security Guards</h3>
            <div className="guards-grid">
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={!!policy?.loopDetectionEnabled}
                  onChange={(e) => setPolicy(p => p ? { ...p, loopDetectionEnabled: e.target.checked ? 1 : 0 } : null)}
                />
                <span>Loop Detection</span>
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={!!policy?.syscallProtectionEnabled}
                  onChange={(e) => setPolicy(p => p ? { ...p, syscallProtectionEnabled: e.target.checked ? 1 : 0 } : null)}
                />
                <span>Syscall Protection</span>
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={!!policy?.destructiveActionsEnabled}
                  onChange={(e) => setPolicy(p => p ? { ...p, destructiveActionsEnabled: e.target.checked ? 1 : 0 } : null)}
                />
                <span>Destructive Actions</span>
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={!!policy?.dataExfilEnabled}
                  onChange={(e) => setPolicy(p => p ? { ...p, dataExfilEnabled: e.target.checked ? 1 : 0 } : null)}
                />
                <span>Data Exfiltration</span>
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={!!policy?.promptInjectionEnabled}
                  onChange={(e) => setPolicy(p => p ? { ...p, promptInjectionEnabled: e.target.checked ? 1 : 0 } : null)}
                />
                <span>Prompt Injection</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Policy"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
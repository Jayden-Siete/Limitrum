"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  organizationId: string;
  environment: string;
  status: string;
  createdAt: string;
}

interface Policy {
  id: string;
  agentId: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string;
  loopDetectionEnabled: number;
  loopDetectionMaxCount: number;
  loopDetectionWindowSec: number;
  syscallProtectionEnabled: number;
  destructiveActionsEnabled: number;
  dataExfilEnabled: number;
  promptInjectionEnabled: number;
  blockedPatterns: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    maxDailySpend: 50,
    perActionCap: 10,
    maxRatePerMinute: 30,
    allowedEndpoints: "",
    loopDetectionEnabled: true,
    syscallProtectionEnabled: true,
    destructiveActionsEnabled: true,
    dataExfilEnabled: true,
    promptInjectionEnabled: false,
  });

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/agents/:id, GET /v1/agents/:id/policy
    setTimeout(() => {
      setAgent({
        id: agentId,
        name: "Sales Agent",
        organizationId: "org_123",
        environment: "production",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
      });
      setPolicy({
        id: "policy_abc123",
        agentId: agentId,
        maxDailySpend: 50,
        perActionCap: 10,
        maxRatePerMinute: 30,
        allowedEndpoints: JSON.stringify(["api.stripe.com", "api.openai.com"]),
        loopDetectionEnabled: 1,
        loopDetectionMaxCount: 5,
        loopDetectionWindowSec: 10,
        syscallProtectionEnabled: 1,
        destructiveActionsEnabled: 1,
        dataExfilEnabled: 1,
        promptInjectionEnabled: 0,
        blockedPatterns: "[]",
      });
      setFormData({
        maxDailySpend: 50,
        perActionCap: 10,
        maxRatePerMinute: 30,
        allowedEndpoints: "api.stripe.com, api.openai.com",
        loopDetectionEnabled: true,
        syscallProtectionEnabled: true,
        destructiveActionsEnabled: true,
        dataExfilEnabled: true,
        promptInjectionEnabled: false,
      });
      setLoading(false);
    }, 500);
  }, [agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // TODO: Connect to real API
    // PUT /v1/agents/:id/policy

    setTimeout(() => {
      setSaving(false);
      alert("Policy saved successfully!");
    }, 500);
  };

  if (loading) {
    return (
      <div className="agent-detail-page">
        <div className="loading">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="agent-detail-page">
        <div className="loading">Agent not found</div>
      </div>
    );
  }

  return (
    <div className="agent-detail-page">
      <Link href="/dashboard/agents" className="back-link">
        ← Back to Agents
      </Link>

      <header className="page-header">
        <div className="header-content">
          <h1>{agent.name}</h1>
          <p className="subtitle">Agent ID: {agent.id}</p>
        </div>
      </header>

      <div className="agent-info">
        <div className="info-card">
          <div className="info-label">Status</div>
          <div className="info-value">
            <span className={`status-badge ${agent.status}`}>
              {agent.status}
            </span>
          </div>
        </div>
        <div className="info-card">
          <div className="info-label">Environment</div>
          <div className="info-value">{agent.environment}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Created</div>
          <div className="info-value">
            {new Date(agent.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="info-card">
          <div className="info-label">Policy</div>
          <div className="info-value">
            {policy ? (
              <span className="policy-badge has-policy">Configured</span>
            ) : (
              <span className="policy-badge no-policy">Not set</span>
            )}
          </div>
        </div>
      </div>

      <div className="policy-editor">
        <h2>Policy Configuration</h2>

        <form className="policy-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Budget Limits</h3>
            <div className="form-row">
              <label>
                Max Daily Spend ($)
                <input
                  type="number"
                  value={formData.maxDailySpend}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDailySpend: Number(e.target.value) })
                  }
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                Per-Action Cap ($)
                <input
                  type="number"
                  value={formData.perActionCap}
                  onChange={(e) =>
                    setFormData({ ...formData, perActionCap: Number(e.target.value) })
                  }
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                Rate Limit (req/min)
                <input
                  type="number"
                  value={formData.maxRatePerMinute}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRatePerMinute: Number(e.target.value) })
                  }
                  min="0"
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
                  value={formData.allowedEndpoints}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedEndpoints: e.target.value })
                  }
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
                  checked={formData.loopDetectionEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, loopDetectionEnabled: e.target.checked })
                  }
                />
                Loop Detection
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={formData.syscallProtectionEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, syscallProtectionEnabled: e.target.checked })
                  }
                />
                Syscall Protection
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={formData.destructiveActionsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, destructiveActionsEnabled: e.target.checked })
                  }
                />
                Destructive Actions
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={formData.dataExfilEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, dataExfilEnabled: e.target.checked })
                  }
                />
                Data Exfiltration
              </label>
              <label className="guard-toggle">
                <input
                  type="checkbox"
                  checked={formData.promptInjectionEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, promptInjectionEnabled: e.target.checked })
                  }
                />
                Prompt Injection
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
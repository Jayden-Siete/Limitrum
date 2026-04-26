"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

type Agent = {
  id: string;
  name: string;
  organizationId: string;
  environment: string;
  status: string;
  createdAt: number;
};

type PolicyResponse = {
  id: string;
  agentId: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string[];
  guards: {
    loopDetection: {
      enabled: boolean;
      maxCount: number;
      windowSec: number;
    };
    syscallProtection: { enabled: boolean };
    destructiveActions: { enabled: boolean };
    dataExfil: { enabled: boolean };
    promptInjection: { enabled: boolean };
  };
  blockedPatterns: string[];
};

type PolicyForm = {
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string[];
  loopDetectionEnabled: boolean;
  loopDetectionMaxCount: number;
  loopDetectionWindowSec: number;
  syscallProtectionEnabled: boolean;
  destructiveActionsEnabled: boolean;
  dataExfilEnabled: boolean;
  promptInjectionEnabled: boolean;
  blockedPatterns: string[];
};

function getApiKey() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("limitrum_api_key");
}

function buildHeaders() {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;
  return headers;
}

function mapPolicyToForm(policy: PolicyResponse): PolicyForm {
  return {
    maxDailySpend: policy.maxDailySpend,
    perActionCap: policy.perActionCap,
    maxRatePerMinute: policy.maxRatePerMinute,
    allowedEndpoints: policy.allowedEndpoints,
    loopDetectionEnabled: policy.guards.loopDetection.enabled,
    loopDetectionMaxCount: policy.guards.loopDetection.maxCount,
    loopDetectionWindowSec: policy.guards.loopDetection.windowSec,
    syscallProtectionEnabled: policy.guards.syscallProtection.enabled,
    destructiveActionsEnabled: policy.guards.destructiveActions.enabled,
    dataExfilEnabled: policy.guards.dataExfil.enabled,
    promptInjectionEnabled: policy.guards.promptInjection.enabled,
    blockedPatterns: policy.blockedPatterns,
  };
}

export function AgentDetailClient() {
  const params = useParams();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<PolicyForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    setError(null);

    try {
      const headers = buildHeaders();
      const [agentRes, policyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/agents/${agentId}`, { headers }),
        fetch(`${API_BASE_URL}/v1/agents/${agentId}/policy`, { headers }),
      ]);

      if (!agentRes.ok) {
        const payload = await agentRes.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Agent not found");
      }

      const agentPayload = (await agentRes.json()) as { agent: Agent };
      setAgent(agentPayload.agent);

      if (policyRes.ok) {
        const policyPayload = (await policyRes.json()) as { policy: PolicyResponse };
        setForm(mapPolicyToForm(policyPayload.policy));
      } else {
        setForm(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateForm = <K extends keyof PolicyForm>(key: K, value: PolicyForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSavePolicy = async () => {
    if (!agentId || !form) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        maxDailySpend: form.maxDailySpend,
        perActionCap: form.perActionCap,
        maxRatePerMinute: form.maxRatePerMinute,
        allowedEndpoints: form.allowedEndpoints,
        loopDetectionEnabled: form.loopDetectionEnabled,
        loopDetectionMaxCount: form.loopDetectionMaxCount,
        loopDetectionWindowSec: form.loopDetectionWindowSec,
        syscallProtectionEnabled: form.syscallProtectionEnabled,
        destructiveActionsEnabled: form.destructiveActionsEnabled,
        dataExfilEnabled: form.dataExfilEnabled,
        promptInjectionEnabled: form.promptInjectionEnabled,
        blockedPatterns: form.blockedPatterns,
      };

      const res = await fetch(`${API_BASE_URL}/v1/agents/${agentId}/policy`, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to save policy");
      }

      const data = (await res.json()) as { policy: PolicyResponse };
      setForm(mapPolicyToForm(data.policy));
      setSaveMessage("Policy saved successfully");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Error saving policy");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading agent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link href="/dashboard/agents" className="btn-secondary">
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="header-left">
          <Link href="/dashboard/agents" className="back-link">
            Back to Agents
          </Link>
          <h1 className="page-title">{agent?.name ?? agentId}</h1>
        </div>
        <div className="header-right">
          <span className={`status-badge status-${agent?.status}`}>{agent?.status}</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="agent-info-card">
          <h2>Agent Details</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Agent ID</span>
              <span className="info-value">{agent?.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Organization</span>
              <span className="info-value">{agent?.organizationId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Environment</span>
              <span className="info-value">{agent?.environment}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="policy-editor-card">
          <h2>Policy Configuration</h2>
          {form ? (
            <div className="policy-form">
              <div className="form-section">
                <h3>Budget Controls</h3>
                <div className="form-row">
                  <label>
                    Max Daily Spend ($)
                    <input
                      type="number"
                      min={0}
                      value={form.maxDailySpend}
                      onChange={(e) => updateForm("maxDailySpend", Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Per-Action Cap ($)
                    <input
                      type="number"
                      min={0}
                      value={form.perActionCap}
                      onChange={(e) => updateForm("perActionCap", Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Max Rate (per minute)
                    <input
                      type="number"
                      min={0}
                      value={form.maxRatePerMinute}
                      onChange={(e) => updateForm("maxRatePerMinute", Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Allowed Endpoints</h3>
                <textarea
                  value={form.allowedEndpoints.join("\n")}
                  onChange={(e) =>
                    updateForm(
                      "allowedEndpoints",
                      e.target.value
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder={"api.openai.com\napi.stripe.com"}
                  rows={4}
                />
              </div>

              <div className="form-section">
                <h3>Security Guards</h3>
                <div className="guards-grid">
                  <label className="guard-toggle">
                    <input
                      type="checkbox"
                      checked={form.loopDetectionEnabled}
                      onChange={(e) =>
                        updateForm("loopDetectionEnabled", e.target.checked)
                      }
                    />
                    <span>Loop Detection</span>
                  </label>
                  <label className="guard-toggle">
                    <input
                      type="checkbox"
                      checked={form.syscallProtectionEnabled}
                      onChange={(e) =>
                        updateForm("syscallProtectionEnabled", e.target.checked)
                      }
                    />
                    <span>Syscall Protection</span>
                  </label>
                  <label className="guard-toggle">
                    <input
                      type="checkbox"
                      checked={form.destructiveActionsEnabled}
                      onChange={(e) =>
                        updateForm("destructiveActionsEnabled", e.target.checked)
                      }
                    />
                    <span>Destructive Actions</span>
                  </label>
                  <label className="guard-toggle">
                    <input
                      type="checkbox"
                      checked={form.dataExfilEnabled}
                      onChange={(e) => updateForm("dataExfilEnabled", e.target.checked)}
                    />
                    <span>Data Exfiltration</span>
                  </label>
                  <label className="guard-toggle">
                    <input
                      type="checkbox"
                      checked={form.promptInjectionEnabled}
                      onChange={(e) =>
                        updateForm("promptInjectionEnabled", e.target.checked)
                      }
                    />
                    <span>Prompt Injection</span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Loop Window</h3>
                <div className="form-row">
                  <label>
                    Max Loop Count
                    <input
                      type="number"
                      min={1}
                      value={form.loopDetectionMaxCount}
                      onChange={(e) =>
                        updateForm("loopDetectionMaxCount", Number(e.target.value))
                      }
                    />
                  </label>
                  <label>
                    Loop Window (sec)
                    <input
                      type="number"
                      min={1}
                      value={form.loopDetectionWindowSec}
                      onChange={(e) =>
                        updateForm("loopDetectionWindowSec", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Blocked Patterns</h3>
                <textarea
                  value={form.blockedPatterns.join("\n")}
                  onChange={(e) =>
                    updateForm(
                      "blockedPatterns",
                      e.target.value
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder={".*\\.exe$\n.*\\.dll$"}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSavePolicy} disabled={saving}>
                  {saving ? "Saving..." : "Save Policy"}
                </button>
                {saveMessage && <span className="save-message">{saveMessage}</span>}
              </div>
            </div>
          ) : (
            <p className="no-policy">No policy configured for this agent.</p>
          )}
        </div>
      </div>
    </div>
  );
}

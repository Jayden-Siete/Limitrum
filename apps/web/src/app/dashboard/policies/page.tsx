"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

type Agent = {
  id: string;
  name: string;
};

type Policy = {
  id: string;
  agentId: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string[];
  guards: {
    loopDetection: { enabled: boolean };
    syscallProtection: { enabled: boolean };
    destructiveActions: { enabled: boolean };
    dataExfil: { enabled: boolean };
    promptInjection: { enabled: boolean };
  };
};

type PolicyCard = {
  id: string;
  agentId: string;
  agentName: string;
  maxDailySpend: number;
  perActionCap: number;
  maxRatePerMinute: number;
  allowedEndpoints: string[];
  guards: {
    loopDetection: boolean;
    syscallProtection: boolean;
    destructiveActions: boolean;
    dataExfil: boolean;
    promptInjection: boolean;
  };
};

function getApiKey() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("limitrum_api_key");
}

async function fetchWithAuth(endpoint: string) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const agentsData = (await fetchWithAuth("/v1/agents?limit=100")) as {
          agents: Agent[];
        };
        const agents = agentsData.agents ?? [];

        const policyResults = await Promise.all(
          agents.map(async (agent) => {
            try {
              const policyData = (await fetchWithAuth(
                `/v1/agents/${agent.id}/policy`,
              )) as { policy: Policy };
              return { agent, policy: policyData.policy };
            } catch {
              return null;
            }
          }),
        );

        if (!mounted) return;

        const cards: PolicyCard[] = policyResults
          .filter((entry): entry is { agent: Agent; policy: Policy } => entry !== null)
          .map(({ agent, policy }) => ({
            id: policy.id,
            agentId: policy.agentId,
            agentName: agent.name,
            maxDailySpend: policy.maxDailySpend,
            perActionCap: policy.perActionCap,
            maxRatePerMinute: policy.maxRatePerMinute,
            allowedEndpoints: policy.allowedEndpoints,
            guards: {
              loopDetection: policy.guards.loopDetection.enabled,
              syscallProtection: policy.guards.syscallProtection.enabled,
              destructiveActions: policy.guards.destructiveActions.enabled,
              dataExfil: policy.guards.dataExfil.enabled,
              promptInjection: policy.guards.promptInjection.enabled,
            },
          }));

        setPolicies(cards);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load policies");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="policies-page">
        <div className="loading">Loading policies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="policies-page">
        <div className="error-banner">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="policies-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Policies</h1>
          <p className="subtitle">Security policies for your agents</p>
        </div>
      </header>

      {policies.length === 0 ? (
        <div className="empty-state">
          <p>No policies configured. Create an agent and add a policy.</p>
          <Link href="/dashboard/agents" className="btn btn-primary" style={{ marginTop: 16 }}>
            Go to Agents
          </Link>
        </div>
      ) : (
        <div className="policies-grid">
          {policies.map((policy) => (
            <div key={policy.id} className="policy-card">
              <div className="policy-header">
                <div>
                  <h3>{policy.agentName}</h3>
                  <div className="policy-id">{policy.id}</div>
                </div>
                <Link href={`/dashboard/agents/${policy.agentId}`} className="btn btn-secondary">
                  Edit
                </Link>
              </div>

              <div className="policy-budget">
                <div className="budget-item">
                  <span className="label">Daily Limit</span>
                  <span className="value">${policy.maxDailySpend}</span>
                </div>
                <div className="budget-item">
                  <span className="label">Per-Action</span>
                  <span className="value">
                    {policy.perActionCap > 0 ? `$${policy.perActionCap}` : "None"}
                  </span>
                </div>
                <div className="budget-item">
                  <span className="label">Rate Limit</span>
                  <span className="value">
                    {policy.maxRatePerMinute > 0 ? `${policy.maxRatePerMinute}/min` : "None"}
                  </span>
                </div>
              </div>

              <div className="policy-guards">
                <h4>Allowed Endpoints</h4>
                <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text2)" }}>
                  {policy.allowedEndpoints.length > 0
                    ? policy.allowedEndpoints.join(", ")
                    : "Open (none)"}
                </div>

                <h4>Active Guards</h4>
                <div className="guards-list">
                  <div className={`guard ${policy.guards.loopDetection ? "active" : "inactive"}`}>
                    {policy.guards.loopDetection ? "Yes" : "No"} Loop Detection
                  </div>
                  <div className={`guard ${policy.guards.syscallProtection ? "active" : "inactive"}`}>
                    {policy.guards.syscallProtection ? "Yes" : "No"} Syscall Protection
                  </div>
                  <div className={`guard ${policy.guards.destructiveActions ? "active" : "inactive"}`}>
                    {policy.guards.destructiveActions ? "Yes" : "No"} Destructive Actions
                  </div>
                  <div className={`guard ${policy.guards.dataExfil ? "active" : "inactive"}`}>
                    {policy.guards.dataExfil ? "Yes" : "No"} Data Exfiltration
                  </div>
                  <div className={`guard ${policy.guards.promptInjection ? "active" : "inactive"}`}>
                    {policy.guards.promptInjection ? "Yes" : "No"} Prompt Injection
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

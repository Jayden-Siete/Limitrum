"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Policy {
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
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/agents + GET /v1/agents/:id/policy
    setTimeout(() => {
      setPolicies([
        {
          id: "policy_abc123",
          agentId: "agent_sales_01",
          agentName: "Sales Agent",
          maxDailySpend: 100,
          perActionCap: 10,
          maxRatePerMinute: 30,
          allowedEndpoints: ["api.stripe.com", "api.openai.com"],
          guards: {
            loopDetection: true,
            syscallProtection: true,
            destructiveActions: true,
            dataExfil: true,
            promptInjection: false,
          },
        },
        {
          id: "policy_def456",
          agentId: "agent_support_02",
          agentName: "Support Agent",
          maxDailySpend: 50,
          perActionCap: 5,
          maxRatePerMinute: 20,
          allowedEndpoints: ["api.stripe.com", "api.zendesk.com"],
          guards: {
            loopDetection: true,
            syscallProtection: true,
            destructiveActions: true,
            dataExfil: false,
            promptInjection: false,
          },
        },
        {
          id: "policy_ghi789",
          agentId: "agent_marketing_03",
          agentName: "Marketing Agent",
          maxDailySpend: 75,
          perActionCap: 0,
          maxRatePerMinute: 0,
          allowedEndpoints: ["api.openai.com", "api.sendgrid.com"],
          guards: {
            loopDetection: true,
            syscallProtection: false,
            destructiveActions: true,
            dataExfil: true,
            promptInjection: false,
          },
        },
        {
          id: "policy_jkl012",
          agentId: "agent_dev_04",
          agentName: "Dev Agent",
          maxDailySpend: 25,
          perActionCap: 2,
          maxRatePerMinute: 10,
          allowedEndpoints: ["api.github.com"],
          guards: {
            loopDetection: true,
            syscallProtection: true,
            destructiveActions: true,
            dataExfil: true,
            promptInjection: true,
          },
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="policies-page">
        <div className="loading">Loading policies...</div>
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
                    {policy.guards.loopDetection ? "✓" : "✗"} Loop Detection
                  </div>
                  <div className={`guard ${policy.guards.syscallProtection ? "active" : "inactive"}`}>
                    {policy.guards.syscallProtection ? "✓" : "✗"} Syscall Protection
                  </div>
                  <div className={`guard ${policy.guards.destructiveActions ? "active" : "inactive"}`}>
                    {policy.guards.destructiveActions ? "✓" : "✗"} Destructive Actions
                  </div>
                  <div className={`guard ${policy.guards.dataExfil ? "active" : "inactive"}`}>
                    {policy.guards.dataExfil ? "✓" : "✗"} Data Exfiltration
                  </div>
                  <div className={`guard ${policy.guards.promptInjection ? "active" : "inactive"}`}>
                    {policy.guards.promptInjection ? "✓" : "✗"} Prompt Injection
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
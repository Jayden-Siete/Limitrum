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
    // TODO: Connect to real API - GET /v1/agents with policy info
    setTimeout(() => {
      setPolicies([
        {
          id: "policy_abc123",
          agentId: "agent_sales_01",
          agentName: "Sales Agent",
          maxDailySpend: 50,
          perActionCap: 10,
          maxRatePerMinute: 30,
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
          maxDailySpend: 30,
          perActionCap: 5,
          maxRatePerMinute: 20,
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
          <p className="subtitle">Manage security and budget policies</p>
        </div>
      </header>

      <div className="policies-grid">
        {policies.map((policy) => (
          <div key={policy.id} className="policy-card">
            <div className="policy-header">
              <h3>{policy.agentName}</h3>
              <span className="policy-id">{policy.id}</span>
            </div>

            <div className="policy-budget">
              <div className="budget-item">
                <span className="label">Daily Limit</span>
                <span className="value">${policy.maxDailySpend.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Per-Action Cap</span>
                <span className="value">${policy.perActionCap.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Rate Limit</span>
                <span className="value">{policy.maxRatePerMinute}/min</span>
              </div>
            </div>

            <div className="policy-guards">
              <h4>Active Guards</h4>
              <div className="guards-list">
                <span className={`guard ${policy.guards.loopDetection ? "active" : "inactive"}`}>
                  {policy.guards.loopDetection ? "✓" : "✗"} Loop Detection
                </span>
                <span className={`guard ${policy.guards.syscallProtection ? "active" : "inactive"}`}>
                  {policy.guards.syscallProtection ? "✓" : "✗"} Syscall Protection
                </span>
                <span className={`guard ${policy.guards.destructiveActions ? "active" : "inactive"}`}>
                  {policy.guards.destructiveActions ? "✓" : "✗"} Destructive Actions
                </span>
                <span className={`guard ${policy.guards.dataExfil ? "active" : "inactive"}`}>
                  {policy.guards.dataExfil ? "✓" : "✗"} Data Exfiltration
                </span>
                <span className={`guard ${policy.guards.promptInjection ? "active" : "inactive"}`}>
                  {policy.guards.promptInjection ? "✓" : "✗"} Prompt Injection
                </span>
              </div>
            </div>

            <div className="policy-actions">
              <Link href={`/dashboard/agents/${policy.agentId}`} className="btn btn-secondary">
                Edit Policy
              </Link>
            </div>
          </div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="empty-state">
          <p>No policies found. Create an agent first to configure policies.</p>
        </div>
      )}
    </div>
  );
}
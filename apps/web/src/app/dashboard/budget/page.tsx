"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

interface BudgetReport {
  agentId: string;
  agentName: string;
  environment: string;
  status: string;
  policy: { maxDailySpend: number; perActionCap: number } | null;
  spend: { today: number; thisWeek: number; thisMonth: number; allTime: number };
  budget: { remaining: number; utilizationPct: number; status: "healthy" | "warning" | "exhausted" };
  activity: { allowedToday: number; blockedToday: number; totalToday: number };
  topGuardsTriggered: { guard: string; count: number }[];
}

interface BudgetSummary {
  totalAgents: number;
  totalSpendToday: number;
  totalSpendThisMonth: number;
  agentsAtRisk: number;
}

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("limitrum_api_key");
}

async function fetchBudgetReport() {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}/v1/budget/report`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch budget: ${res.status}`);
  return res.json();
}

export default function BudgetPage() {
  const [report, setReport] = useState<BudgetReport[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBudgetReport();
      setReport(data.report ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const totalBudget = report.reduce((sum, r) => sum + (r.policy?.maxDailySpend ?? 0), 0);
  const totalSpent = report.reduce((sum, r) => sum + r.spend.today, 0);
  const totalRemaining = report.reduce((sum, r) => sum + r.budget.remaining, 0);

  if (loading) {
    return (
      <div className="budget-page">
        <div className="loading">Loading budget data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-page">
        <div className="error">
          <p>Error loading budget: {error}</p>
          <button onClick={loadBudget} className="btn btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Budget</h1>
          <p className="subtitle">Monitor spending across all agents</p>
        </div>
        <button onClick={loadBudget} className="btn btn-secondary">Refresh</button>
      </header>

      <div className="budget-summary">
        <div className="summary-card">
          <div className="summary-label">Total Budget</div>
          <div className="summary-value">${totalBudget.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Spent Today</div>
          <div className="summary-value spent">${totalSpent.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Remaining</div>
          <div className="summary-value remaining">${totalRemaining.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Utilization</div>
          <div className="summary-value">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {summary && (
        <div className="budget-stats-row">
          <span>Agents at risk: {summary.agentsAtRisk}</span>
          <span>Total this month: ${summary.totalSpendThisMonth.toFixed(2)}</span>
        </div>
      )}

      <div className="budget-bars">
        {report.map((budget) => {
          const utilization = budget.policy?.maxDailySpend
            ? (budget.spend.today / budget.policy.maxDailySpend) * 100
            : 0;
          const status = budget.budget.status;

          return (
            <div key={budget.agentId} className="budget-bar-card">
              <div className="bar-header">
                <div>
                  <div className="agent-name">{budget.agentName}</div>
                  <div className="agent-id">{budget.agentId}</div>
                </div>
                <div className={`status-indicator ${status}`}>
                  {status === "exhausted" ? "Exceeded" : status === "warning" ? "Warning" : "OK"}
                </div>
              </div>
              <div className="bar-progress">
                <div
                  className={`bar-fill ${status}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <div className="bar-details">
                <span>Spent: ${budget.spend.today.toFixed(2)}</span>
                <span className={budget.budget.remaining <= 0 ? "remaining empty" : "remaining"}>
                  Remaining: ${budget.budget.remaining.toFixed(2)}
                </span>
                <span>Limit: ${budget.policy?.maxDailySpend?.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {report.length === 0 ? (
        <div className="empty-state">
          <p>No budget data found. Create an agent and configure a policy.</p>
        </div>
      ) : (
        <div className="budget-table">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Limit</th>
                <th>Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.map((budget) => {
                const utilization = budget.policy?.maxDailySpend
                  ? (budget.spend.today / budget.policy.maxDailySpend) * 100
                  : 0;
                const status = budget.budget.status;

                return (
                  <tr key={budget.agentId}>
                    <td className="agent-cell">
                      <Link href={`/dashboard/agents/${budget.agentId}`} className="agent-name">
                        {budget.agentName}
                      </Link>
                      <div className="agent-id">{budget.agentId}</div>
                    </td>
                    <td className="spent">${budget.spend.today.toFixed(2)}</td>
                    <td className={budget.budget.remaining <= 0 ? "remaining empty" : ""}>
                      ${budget.budget.remaining.toFixed(2)}
                    </td>
                    <td>${budget.policy?.maxDailySpend?.toFixed(2) ?? "0.00"}</td>
                    <td>
                      <div className="utilization-cell">
                        <span>{utilization.toFixed(1)}%</span>
                        <div className="mini-bar">
                          <div
                            className={`mini-fill ${status}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-indicator ${status}`}>
                        {status === "exhausted" ? "Exceeded" : status === "warning" ? "Warning" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
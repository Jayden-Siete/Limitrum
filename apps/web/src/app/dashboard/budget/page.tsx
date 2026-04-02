"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BudgetData {
  agentId: string;
  agentName: string;
  maxDailySpend: number;
  spent: number;
  remaining: number;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/budget/report
    setTimeout(() => {
      setBudgets([
        { agentId: "agent_sales_01", agentName: "Sales Agent", maxDailySpend: 100, spent: 45.32, remaining: 54.68 },
        { agentId: "agent_support_02", agentName: "Support Agent", maxDailySpend: 50, spent: 32.15, remaining: 17.85 },
        { agentId: "agent_marketing_03", agentName: "Marketing Agent", maxDailySpend: 75, spent: 0, remaining: 75 },
        { agentId: "agent_dev_04", agentName: "Dev Agent", maxDailySpend: 25, spent: 23.50, remaining: 1.50 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const totalBudget = budgets.reduce((sum, b) => sum + b.maxDailySpend, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);

  if (loading) {
    return (
      <div className="budget-page">
        <div className="loading">Loading budget data...</div>
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
      </header>

      <div className="budget-summary">
        <div className="summary-card">
          <div className="summary-label">Total Budget</div>
          <div className="summary-value">${totalBudget.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Spent</div>
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

      <div className="budget-bars">
        {budgets.map((budget) => {
          const utilization = budget.maxDailySpend > 0 ? (budget.spent / budget.maxDailySpend) * 100 : 0;
          const status = utilization >= 100 ? "exceeded" : utilization >= 80 ? "warning" : "ok";

          return (
            <div key={budget.agentId} className="budget-bar-card">
              <div className="bar-header">
                <div>
                  <div className="agent-name">{budget.agentName}</div>
                  <div className="agent-id">{budget.agentId}</div>
                </div>
                <div className={`status-indicator ${status}`}>
                  {status === "exceeded" ? "Exceeded" : status === "warning" ? "Warning" : "OK"}
                </div>
              </div>
              <div className="bar-progress">
                <div
                  className={`bar-fill ${status}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <div className="bar-details">
                <span>Spent: ${budget.spent.toFixed(2)}</span>
                <span className={budget.remaining <= 0 ? "remaining empty" : "remaining"}>
                  Remaining: ${budget.remaining.toFixed(2)}
                </span>
                <span>Limit: ${budget.maxDailySpend.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

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
            {budgets.map((budget) => {
              const utilization = budget.maxDailySpend > 0 ? (budget.spent / budget.maxDailySpend) * 100 : 0;
              const status = utilization >= 100 ? "exceeded" : utilization >= 80 ? "warning" : "ok";

              return (
                <tr key={budget.agentId}>
                  <td className="agent-cell">
                    <Link href={`/dashboard/agents/${budget.agentId}`} className="agent-name">
                      {budget.agentName}
                    </Link>
                    <div className="agent-id">{budget.agentId}</div>
                  </td>
                  <td className="spent">${budget.spent.toFixed(2)}</td>
                  <td className={budget.remaining <= 0 ? "remaining empty" : ""}>
                    ${budget.remaining.toFixed(2)}
                  </td>
                  <td>${budget.maxDailySpend.toFixed(2)}</td>
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
                      {status === "exceeded" ? "Exceeded" : status === "warning" ? "Warning" : "OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
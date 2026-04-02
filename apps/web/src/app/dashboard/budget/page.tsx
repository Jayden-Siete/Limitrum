"use client";

import { useEffect, useState } from "react";

interface BudgetReport {
  agentId: string;
  agentName: string;
  maxDailySpend: number;
  spent: number;
  remaining: number;
  utilizationPct: number;
}

export default function BudgetPage() {
  const [reports, setReports] = useState<BudgetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    // TODO: Connect to real API - GET /v1/budget/report
    setTimeout(() => {
      const mockReports: BudgetReport[] = [
        { agentId: "agent_sales_01", agentName: "Sales Agent", maxDailySpend: 50, spent: 32.5, remaining: 17.5, utilizationPct: 65 },
        { agentId: "agent_support_02", agentName: "Support Agent", maxDailySpend: 30, spent: 12.8, remaining: 17.2, utilizationPct: 42.7 },
        { agentId: "agent_dev_03", agentName: "Dev Agent", maxDailySpend: 20, spent: 0, remaining: 20, utilizationPct: 0 },
      ];
      setReports(mockReports);
      setTotalBudget(mockReports.reduce((sum, r) => sum + r.maxDailySpend, 0));
      setTotalSpent(mockReports.reduce((sum, r) => sum + r.spent, 0));
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="budget-page">
        <div className="loading">Loading budget reports...</div>
      </div>
    );
  }

  const totalRemaining = totalBudget - totalSpent;
  const totalUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="budget-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Budget Reports</h1>
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
          <div className="summary-label">Total Remaining</div>
          <div className="summary-value remaining">${totalRemaining.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Utilization</div>
          <div className="summary-value">{totalUtilization.toFixed(1)}%</div>
        </div>
      </div>

      <div className="budget-bars">
        {reports.map((report) => (
          <div key={report.agentId} className="budget-bar-card">
            <div className="bar-header">
              <span className="agent-name">{report.agentName}</span>
              <span className="agent-id">{report.agentId}</span>
            </div>
            <div className="bar-progress">
              <div
                className={`bar-fill ${report.utilizationPct >= 80 ? "warning" : ""} ${report.utilizationPct >= 100 ? "exceeded" : ""}`}
                style={{ width: `${Math.min(100, report.utilizationPct)}%` }}
              />
            </div>
            <div className="bar-details">
              <span className="spent">${report.spent.toFixed(2)} spent</span>
              <span className="limit">of ${report.maxDailySpend.toFixed(2)}</span>
              <span className={`remaining ${report.remaining <= 0 ? "empty" : ""}`}>
                ${report.remaining.toFixed(2)} remaining
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="budget-table">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Daily Limit</th>
              <th>Spent Today</th>
              <th>Remaining</th>
              <th>Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.agentId}>
                <td className="agent-cell">
                  <div className="agent-name">{report.agentName}</div>
                  <div className="agent-id">{report.agentId}</div>
                </td>
                <td>${report.maxDailySpend.toFixed(2)}</td>
                <td className="spent">${report.spent.toFixed(2)}</td>
                <td className={`remaining ${report.remaining <= 0 ? "empty" : ""}`}>
                  ${report.remaining.toFixed(2)}
                </td>
                <td>
                  <div className="utilization-cell">
                    <span>{report.utilizationPct.toFixed(1)}%</span>
                    <div className="mini-bar">
                      <div
                        className="mini-fill"
                        style={{ width: `${Math.min(100, report.utilizationPct)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-indicator ${report.utilizationPct >= 100 ? "exceeded" : report.utilizationPct >= 80 ? "warning" : "ok"}`}>
                    {report.utilizationPct >= 100 ? "Exceeded" : report.utilizationPct >= 80 ? "Warning" : "OK"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
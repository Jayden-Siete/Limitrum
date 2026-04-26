"use client";

import Link from "next/link";
import { useDashboardData } from "@/hooks";

export default function DashboardPage() {
  const { stats, recentLogs, loading, error, refresh } = useDashboardData();

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <div className="error">
          <p>Error loading dashboard: {error}</p>
          <button onClick={refresh} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const blockRate = stats.totalRequests > 0
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : "0.0";
  const budgetUsed = stats.budgetLimit > 0
    ? ((stats.totalSpend / stats.budgetLimit) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="dashboard-overview">
      <header className="page-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="subtitle">Monitor your agents and security policies</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={refresh} className="btn btn-secondary">
            Refresh
          </button>
          <Link href="/dashboard/agents" className="btn btn-primary">
            Add Agent
          </Link>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">◈</span>
          <div>
            <div className="stat-value">{stats.totalAgents}</div>
            <div className="stat-label">Total Agents</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">●</span>
          <div>
            <div className="stat-value">{stats.activeAgents}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">◫</span>
          <div>
            <div className="stat-value">{stats.totalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">◻</span>
          <div>
            <div className="stat-value">{blockRate}%</div>
            <div className="stat-label">Block Rate</div>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-grid">
          <div className="activity-card allowed">
            <div className="activity-value">{stats.totalRequests - stats.blockedRequests}</div>
            <div className="activity-label">Allowed</div>
          </div>
          <div className="activity-card blocked">
            <div className="activity-value">{stats.blockedRequests}</div>
            <div className="activity-label">Blocked</div>
          </div>
          <div className="activity-card spend">
            <div className="activity-value">${stats.totalSpend.toFixed(2)}</div>
            <div className="activity-label">
              Spent ({budgetUsed}% of ${stats.budgetLimit})
            </div>
          </div>
        </div>

        {Object.keys(stats.guardStats).length > 0 && (
          <div className="guard-stats" style={{ marginTop: 16 }}>
            <h3>Guard Breakdown</h3>
            <div className="guard-grid">
              {Object.entries(stats.guardStats).map(([guard, count]) => (
                <div key={guard} className="guard-card">
                  <span className="guard-name">{guard}</span>
                  <span className="guard-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="logs-table" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="action">{log.action}</td>
                  <td className="target">{log.target}</td>
                  <td>
                    <span className={`decision-badge ${log.decision}`}>
                      {log.decision}
                    </span>
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                    No activity yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/dashboard/logs" className="btn btn-secondary">
            View All Logs
          </Link>
        </div>
      </div>
    </div>
  );
}
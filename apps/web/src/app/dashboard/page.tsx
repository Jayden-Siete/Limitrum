"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalRequests: number;
  blockedRequests: number;
  totalSpend: number;
  budgetLimit: number;
}

interface RecentActivity {
  id: string;
  action: string;
  target: string;
  decision: "allowed" | "blocked";
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    activeAgents: 0,
    totalRequests: 0,
    blockedRequests: 0,
    totalSpend: 0,
    budgetLimit: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/agents, GET /v1/logs, GET /v1/budget/report
    setTimeout(() => {
      setStats({
        totalAgents: 5,
        activeAgents: 3,
        totalRequests: 1247,
        blockedRequests: 89,
        totalSpend: 156.32,
        budgetLimit: 500,
      });
      setRecentActivity([
        { id: "1", action: "openai.chat.completions.create", target: "api.openai.com", decision: "allowed", timestamp: "2024-01-15T10:30:00Z" },
        { id: "2", action: "tool:stripe.charges.create", target: "api.stripe.com", decision: "allowed", timestamp: "2024-01-15T10:29:45Z" },
        { id: "3", action: "spawn_process", target: "/bin/bash", decision: "blocked", timestamp: "2024-01-15T10:29:30Z" },
        { id: "4", action: "http.get", target: "api.example.com", decision: "blocked", timestamp: "2024-01-15T10:29:15Z" },
        { id: "5", action: "openai.chat.completions.create", target: "api.openai.com", decision: "allowed", timestamp: "2024-01-15T10:29:00Z" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="loading">Loading dashboard...</div>
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
        <Link href="/dashboard/agents" className="btn btn-primary">
          Add Agent
        </Link>
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
            <div className="activity-label">Spent ({budgetUsed}% of ${stats.budgetLimit})</div>
          </div>
        </div>

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
              {recentActivity.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">
                    {new Date(log.timestamp).toLocaleTimeString()}
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
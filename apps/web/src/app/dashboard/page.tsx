"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalPolicies: number;
  blockedToday: number;
  allowedToday: number;
  totalSpendToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalPolicies: 0,
    blockedToday: 0,
    allowedToday: 0,
    totalSpendToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API
    // For now, show placeholder data
    setTimeout(() => {
      setStats({
        totalAgents: 5,
        activeAgents: 3,
        totalPolicies: 5,
        blockedToday: 12,
        allowedToday: 148,
        totalSpendToday: 42.5,
      });
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

  const blockRate = stats.allowedToday + stats.blockedToday > 0
    ? ((stats.blockedToday / (stats.allowedToday + stats.blockedToday)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="dashboard-overview">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p className="subtitle">Monitor your agents and policies in real-time</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAgents}</div>
            <div className="stat-label">Total Agents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeAgents}</div>
            <div className="stat-label">Active Agents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPolicies}</div>
            <div className="stat-label">Total Policies</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-value">{blockRate}%</div>
            <div className="stat-label">Block Rate</div>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h2>Today's Activity</h2>
        <div className="activity-grid">
          <div className="activity-card allowed">
            <div className="activity-value">{stats.allowedToday}</div>
            <div className="activity-label">Allowed</div>
          </div>
          <div className="activity-card blocked">
            <div className="activity-value">{stats.blockedToday}</div>
            <div className="activity-label">Blocked</div>
          </div>
          <div className="activity-card spend">
            <div className="activity-value">${stats.totalSpendToday.toFixed(2)}</div>
            <div className="activity-label">Total Spend</div>
          </div>
        </div>
      </div>
    </div>
  );
}
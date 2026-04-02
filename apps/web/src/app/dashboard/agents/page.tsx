"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  status: string;
  environment: string;
  createdAt: number;
  hasPolicy: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API - GET /v1/agents
    setTimeout(() => {
      setAgents([
        {
          id: "agent_sales_01",
          name: "Sales Agent",
          status: "active",
          environment: "production",
          createdAt: Date.now() - 86400000 * 7,
          hasPolicy: true,
        },
        {
          id: "agent_support_02",
          name: "Support Agent",
          status: "active",
          environment: "production",
          createdAt: Date.now() - 86400000 * 3,
          hasPolicy: true,
        },
        {
          id: "agent_dev_03",
          name: "Dev Agent",
          status: "paused",
          environment: "development",
          createdAt: Date.now() - 86400000,
          hasPolicy: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="agents-page">
        <div className="loading">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="agents-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Agents</h1>
          <p className="subtitle">Manage your autonomous agents</p>
        </div>
        <button className="btn btn-primary">+ Add Agent</button>
      </header>

      <div className="agents-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Status</th>
              <th>Environment</th>
              <th>Policy</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td className="agent-name">{agent.name}</td>
                <td className="agent-id">{agent.id}</td>
                <td>
                  <span className={`status-badge ${agent.status}`}>
                    {agent.status}
                  </span>
                </td>
                <td>{agent.environment}</td>
                <td>
                  {agent.hasPolicy ? (
                    <span className="policy-badge has-policy">Configured</span>
                  ) : (
                    <span className="policy-badge no-policy">None</span>
                  )}
                </td>
                <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/dashboard/agents/${agent.id}`} className="btn-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {agents.length === 0 && (
        <div className="empty-state">
          <p>No agents found. Create your first agent to get started.</p>
        </div>
      )}
    </div>
  );
}
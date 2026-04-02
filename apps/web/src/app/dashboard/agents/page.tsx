"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  organizationId: string;
  environment: string;
  status: string;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/agents
    setTimeout(() => {
      setAgents([
        { id: "agent_sales_01", name: "Sales Agent", organizationId: "org_123", environment: "production", status: "active", createdAt: "2024-01-01T00:00:00Z" },
        { id: "agent_support_02", name: "Support Agent", organizationId: "org_123", environment: "production", status: "active", createdAt: "2024-01-05T00:00:00Z" },
        { id: "agent_marketing_03", name: "Marketing Agent", organizationId: "org_123", environment: "staging", status: "paused", createdAt: "2024-01-10T00:00:00Z" },
        { id: "agent_dev_04", name: "Dev Agent", organizationId: "org_123", environment: "development", status: "active", createdAt: "2024-01-12T00:00:00Z" },
        { id: "agent_legacy_05", name: "Legacy Agent", organizationId: "org_123", environment: "production", status: "disabled", createdAt: "2023-06-01T00:00:00Z" },
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
        <button className="btn btn-primary">Create Agent</button>
      </header>

      {agents.length === 0 ? (
        <div className="empty-state">
          <p>No agents found. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="agents-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Agent ID</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <Link href={`/dashboard/agents/${agent.id}`} className="agent-name">
                      {agent.name}
                    </Link>
                  </td>
                  <td>
                    <span className="agent-id">{agent.id}</span>
                  </td>
                  <td>{agent.environment}</td>
                  <td>
                    <span className={`status-badge ${agent.status}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/dashboard/agents/${agent.id}`} className="btn btn-secondary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
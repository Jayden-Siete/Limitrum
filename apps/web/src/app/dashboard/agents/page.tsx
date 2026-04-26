"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

interface Agent {
  id: string;
  name: string;
  organizationId: string;
  environment: string;
  status: string;
  createdAt: number;
}

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("limitrum_api_key");
}

async function fetchAgents(limit = 100, offset = 0) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}/v1/agents?limit=${limit}&offset=${offset}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  return res.json();
}

async function createAgent(name: string, environment: string) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}/v1/agents`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, environment }),
  });
  if (!res.ok) throw new Error(`Failed to create agent: ${res.status}`);
  return res.json();
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEnv, setNewAgentEnv] = useState("development");
  const [creating, setCreating] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgents(limit, offset);
      setAgents(data.agents ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    setCreating(true);
    try {
      await createAgent(newAgentName.trim(), newAgentEnv);
      setShowModal(false);
      setNewAgentName("");
      setNewAgentEnv("development");
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && agents.length === 0) {
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Create Agent
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="empty-state">
          <p>No agents found. Create your first agent to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create Agent
          </button>
        </div>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </button>
              <span>
                Page {Math.floor(offset / limit) + 1} of {totalPages}
              </span>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Agent Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Agent</h2>
            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label htmlFor="agent-name">Agent Name</label>
                <input
                  id="agent-name"
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g., Sales Agent"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="agent-env">Environment</label>
                <select
                  id="agent-env"
                  value={newAgentEnv}
                  onChange={(e) => setNewAgentEnv(e.target.value)}
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

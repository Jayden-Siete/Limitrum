"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

interface LogEntry {
  id: string;
  agentId: string;
  action: string;
  target: string;
  decision: "allowed" | "blocked";
  reason: string;
  guardTriggered: string | null;
  amount: number;
  createdAt: number;
}

interface Agent {
  id: string;
  name: string;
}

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("limitrum_api_key");
}

async function fetchLogs(limit = 20, offset = 0, filters: { decision?: string; agentId?: string } = {}) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (filters.decision && filters.decision !== "all") params.set("decision", filters.decision);
  if (filters.agentId && filters.agentId !== "all") params.set("agentId", filters.agentId);

  const res = await fetch(`${API_BASE_URL}/v1/logs?${params}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
  return res.json();
}

async function fetchAgents() {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Limitrum-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}/v1/agents?limit=100`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  return res.json();
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [filterDecision, setFilterDecision] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [logsData, agentsData] = await Promise.all([
        fetchLogs(limit, offset, { decision: filterDecision, agentId: filterAgent }),
        fetchAgents(),
      ]);

      setLogs(logsData.logs ?? []);
      setTotal(logsData.total ?? 0);
      setAgents(agentsData.agents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [offset, filterDecision, filterAgent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="logs-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Logs</h1>
          <p className="subtitle">Audit trail of all agent actions</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          Refresh
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="logs-filters">
        <div className="filter-group">
          <label>Decision:</label>
          <select
            value={filterDecision}
            onChange={(e) => {
              setFilterDecision(e.target.value);
              setOffset(0);
            }}
          >
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Agent:</label>
          <select
            value={filterAgent}
            onChange={(e) => {
              setFilterAgent(e.target.value);
              setOffset(0);
            }}
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-stats">Showing {logs.length} of {total} entries</div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="loading">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <p>No logs found matching your filters.</p>
        </div>
      ) : (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Target</th>
                <th>Amount</th>
                <th>Decision</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>{log.agentId}</td>
                  <td className="action">{log.action}</td>
                  <td className="target">{log.target}</td>
                  <td>${log.amount.toFixed(2)}</td>
                  <td>
                    <span className={`decision-badge ${log.decision}`}>
                      {log.decision}
                    </span>
                  </td>
                  <td className="reason" title={log.reason}>
                    {log.guardTriggered && (
                      <span className="guard-tag">[{log.guardTriggered}]</span>
                    )}
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            Previous
          </button>
          <span>
            Page {Math.floor(offset / limit) + 1} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
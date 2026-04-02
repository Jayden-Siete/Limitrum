"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  target: string;
  decision: "allowed" | "blocked";
  reason: string;
  guardTriggered: string | null;
  amount: number;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterDecision, setFilterDecision] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const pageSize = 20;

  useEffect(() => {
    // TODO: Connect to real API
    // GET /v1/logs?page=X&decision=Y&agentId=Z
    setTimeout(() => {
      const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `log_${i}`,
        agentId: i % 3 === 0 ? "agent_sales_01" : i % 3 === 1 ? "agent_support_02" : "agent_dev_04",
        agentName: i % 3 === 0 ? "Sales Agent" : i % 3 === 1 ? "Support Agent" : "Dev Agent",
        action: i % 4 === 0 ? "openai.chat.completions.create" : i % 4 === 1 ? "tool:stripe.charges.create" : i % 4 === 2 ? "http.get" : "tool:github.repos.create",
        target: i % 5 === 0 ? "api.openai.com" : i % 5 === 1 ? "api.stripe.com" : "api.github.com",
        decision: i % 7 === 0 ? "blocked" : "allowed",
        reason: i % 7 === 0 ? "Domain not in allowlist" : "Intent accepted by deterministic policy kernel.",
        guardTriggered: i % 7 === 0 ? "domain-allowlist" : null,
        amount: Math.random() * 5,
        createdAt: new Date(Date.now() - i * 60000).toISOString(),
      }));
      setLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterDecision !== "all" && log.decision !== filterDecision) return false;
    if (filterAgent !== "all" && log.agentId !== filterAgent) return false;
    return true;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const agents = Array.from(new Set(logs.map((l) => ({ id: l.agentId, name: l.agentName }))));

  if (loading) {
    return (
      <div className="logs-page">
        <div className="loading">Loading logs...</div>
      </div>
    );
  }

  return (
    <div className="logs-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Logs</h1>
          <p className="subtitle">Audit trail of all agent actions</p>
        </div>
      </header>

      <div className="logs-filters">
        <div className="filter-group">
          <label>Decision:</label>
          <select value={filterDecision} onChange={(e) => { setFilterDecision(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Agent:</label>
          <select value={filterAgent} onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}>
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-stats">
          Showing {paginatedLogs.length} of {filteredLogs.length} entries
        </div>
      </div>

      {paginatedLogs.length === 0 ? (
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
              {paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>{log.agentName}</td>
                  <td className="action">{log.action}</td>
                  <td className="target">{log.target}</td>
                  <td>${log.amount.toFixed(2)}</td>
                  <td>
                    <span className={`decision-badge ${log.decision}`}>
                      {log.decision}
                    </span>
                  </td>
                  <td className="reason">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
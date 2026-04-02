"use client";

import { useEffect, useState } from "react";

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

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "allowed" | "blocked">("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    // TODO: Connect to real API - GET /v1/logs
    setTimeout(() => {
      const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `log_${i}`,
        agentId: i % 3 === 0 ? "agent_sales_01" : i % 3 === 1 ? "agent_support_02" : "agent_dev_03",
        action: ["openai.chat.completions.create", "anthropic.messages.create", "http.post"][i % 3],
        target: ["api.openai.com", "api.anthropic.com", "api.stripe.com"][i % 3],
        decision: i % 5 === 0 ? "blocked" : "allowed",
        reason: i % 5 === 0 ? "Budget exceeded" : "Intent accepted",
        guardTriggered: i % 5 === 0 ? "budget-daily" : null,
        amount: i % 5 === 0 ? 0 : 0.5,
        createdAt: Date.now() - i * 60000,
      }));
      setLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && log.decision !== filter) return false;
    if (agentFilter && !log.agentId.toLowerCase().includes(agentFilter.toLowerCase())) return false;
    return true;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

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
          <h1>Audit Logs</h1>
          <p className="subtitle">View all agent action decisions</p>
        </div>
      </header>

      <div className="logs-filters">
        <div className="filter-group">
          <label>Decision:</label>
          <select value={filter} onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}>
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Agent ID:</label>
          <input
            type="text"
            value={agentFilter}
            onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            placeholder="Search by agent..."
          />
        </div>
        <div className="filter-stats">
          Showing {paginatedLogs.length} of {filteredLogs.length} logs
        </div>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Agent</th>
              <th>Action</th>
              <th>Target</th>
              <th>Decision</th>
              <th>Guard</th>
              <th>Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td className="timestamp">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="agent-id">{log.agentId}</td>
                <td className="action">{log.action}</td>
                <td className="target">{log.target}</td>
                <td>
                  <span className={`decision-badge ${log.decision}`}>
                    {log.decision}
                  </span>
                </td>
                <td>{log.guardTriggered || "—"}</td>
                <td>${log.amount.toFixed(2)}</td>
                <td className="reason">{log.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}

      {filteredLogs.length === 0 && (
        <div className="empty-state">
          <p>No logs found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
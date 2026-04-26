import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_LIMITRUM_API_URL ?? "http://localhost:8000";

export interface Agent {
  id: string;
  name: string;
  status: string;
  environment: string;
  createdAt: number;
}

export interface LogEntry {
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

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalRequests: number;
  blockedRequests: number;
  totalSpend: number;
  budgetLimit: number;
  guardStats: Record<string, number>;
}

export interface DashboardData {
  stats: DashboardStats;
  recentLogs: LogEntry[];
  loading: boolean;
  error: string | null;
}

async function fetchWithAuth(endpoint: string) {
  const apiKey = localStorage.getItem("limitrum_api_key");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["X-Limitrum-API-Key"] = apiKey;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalAgents: 0,
      activeAgents: 0,
      totalRequests: 0,
      blockedRequests: 0,
      totalSpend: 0,
      budgetLimit: 0,
      guardStats: {},
    },
    recentLogs: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch agents and logs in parallel
      const [agentsRes, logsRes] = await Promise.all([
        fetchWithAuth("/v1/agents?limit=100").catch(() => ({ agents: [], total: 0 })),
        fetchWithAuth("/v1/logs?limit=50").catch(() => ({ logs: [], total: 0 })),
      ]);

      const agents = agentsRes.agents ?? [];
      const logs = logsRes.logs ?? [];

      // Calculate stats
      const activeAgents = agents.filter((a: Agent) => a.status === "active").length;
      const totalRequests = logs.length;
      const blockedRequests = logs.filter((l: LogEntry) => l.decision === "blocked").length;

      // Calculate spend (sum of amounts from allowed requests)
      const totalSpend = logs
        .filter((l: LogEntry) => l.decision === "allowed")
        .reduce((sum: number, l: LogEntry) => sum + (l.amount ?? 0), 0);

      // Guard stats
      const guardStats: Record<string, number> = {};
      logs
        .filter((l: LogEntry) => l.decision === "blocked" && l.guardTriggered)
        .forEach((l: LogEntry) => {
          const guard = l.guardTriggered ?? "unknown";
          guardStats[guard] = (guardStats[guard] ?? 0) + 1;
        });

      // Budget limit (sum of all agent policies)
      let budgetLimit = 0;
      try {
        const budgetRes = await fetchWithAuth("/v1/budget/report");
        if (Array.isArray(budgetRes.report)) {
          budgetLimit = budgetRes.report.reduce(
            (
              sum: number,
              item: { policy?: { maxDailySpend?: number } | null },
            ) => sum + (item.policy?.maxDailySpend ?? 0),
            0,
          );
        }
      } catch {
        // Budget API might not be available
        budgetLimit = 0;
      }

      setData({
        stats: {
          totalAgents: agents.length,
          activeAgents,
          totalRequests,
          blockedRequests,
          totalSpend,
          budgetLimit,
          guardStats,
        },
        recentLogs: logs.slice(0, 10),
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch data",
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, refresh };
}

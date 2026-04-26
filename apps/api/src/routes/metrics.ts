import { Hono } from "hono";
import { db, agents, intentLogs, eq, and, desc, gte, inArray, sql } from "@limitrum/db";

export const metricsRouter = new Hono<{ Variables: { organizationId: string } }>();

function getWindowStart(window: string, now: number) {
  switch (window) {
    case "1h":
      return now - 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "24h":
    default:
      return now - 24 * 60 * 60 * 1000;
  }
}

metricsRouter.get("/", async (c) => {
  const organizationId = c.get("organizationId");
  const now = Date.now();
  const window = c.req.query("window") ?? "24h";
  const from = getWindowStart(window, now);

  const orgAgents = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.organizationId, organizationId));

  const agentIds = orgAgents.map((agent) => agent.id);
  if (agentIds.length === 0) {
    return c.json({
      organizationId,
      window,
      generatedAt: now,
      totals: { requests: 0, allowed: 0, blocked: 0, spend: 0, blockRate: 0 },
      topGuardsTriggered: [],
    });
  }

  const baseConditions = [inArray(intentLogs.agentId, agentIds), gte(intentLogs.createdAt, from)];

  const [totalRows, allowedRows, blockedRows, spendRows, topGuards] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(intentLogs)
      .where(and(...baseConditions)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(intentLogs)
      .where(and(...baseConditions, eq(intentLogs.decision, "allowed"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(intentLogs)
      .where(and(...baseConditions, eq(intentLogs.decision, "blocked"))),
    db
      .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
      .from(intentLogs)
      .where(and(...baseConditions, eq(intentLogs.decision, "allowed"))),
    db
      .select({
        guard: intentLogs.guardTriggered,
        count: sql<number>`count(*)`,
      })
      .from(intentLogs)
      .where(and(...baseConditions, eq(intentLogs.decision, "blocked")))
      .groupBy(intentLogs.guardTriggered)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  const requests = Number(totalRows[0]?.count ?? 0);
  const allowed = Number(allowedRows[0]?.count ?? 0);
  const blocked = Number(blockedRows[0]?.count ?? 0);
  const spend = Number(spendRows[0]?.total ?? 0);

  return c.json({
    organizationId,
    window,
    generatedAt: now,
    totals: {
      requests,
      allowed,
      blocked,
      spend,
      blockRate: requests > 0 ? Math.round((blocked / requests) * 10000) / 100 : 0,
    },
    topGuardsTriggered: topGuards.map((row) => ({
      guard: row.guard ?? "unknown",
      count: Number(row.count),
    })),
  });
});

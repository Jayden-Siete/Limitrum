import { Hono } from "hono";
import { db, intentLogs, agents, policies, eq, and, gte, sql, desc } from "@limitrum/db";

export const budgetRouter = new Hono<{ Variables: { organizationId: string } }>();

function getStartOfUtcDayMs(nowMs: number) {
  const d = new Date(nowMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfUtcWeekMs(nowMs: number) {
  const d = new Date(nowMs);
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfUtcMonthMs(nowMs: number) {
  const d = new Date(nowMs);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

// ── GET /v1/budget/report ─────────────────────────────────────────────────────

budgetRouter.get("/report", async (c) => {
  const organizationId = c.get("organizationId");
  const now = Date.now();

  const orgAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.organizationId, organizationId));

  if (orgAgents.length === 0) {
    return c.json({ report: [], organizationId, generatedAt: now });
  }

  const startOfDay = getStartOfUtcDayMs(now);
  const startOfWeek = getStartOfUtcWeekMs(now);
  const startOfMonth = getStartOfUtcMonthMs(now);

  const report = await Promise.all(
    orgAgents.map(async (agent) => {
      const policy = await db
        .select()
        .from(policies)
        .where(eq(policies.agentId, agent.id))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      const [daySpend, weekSpend, monthSpend, totalSpend] = await Promise.all([
        db
          .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
          .from(intentLogs)
          .where(
            and(
              eq(intentLogs.agentId, agent.id),
              eq(intentLogs.decision, "allowed"),
              gte(intentLogs.createdAt, startOfDay),
            ),
          )
          .then((rows) => Number(rows[0]?.total ?? 0)),

        db
          .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
          .from(intentLogs)
          .where(
            and(
              eq(intentLogs.agentId, agent.id),
              eq(intentLogs.decision, "allowed"),
              gte(intentLogs.createdAt, startOfWeek),
            ),
          )
          .then((rows) => Number(rows[0]?.total ?? 0)),

        db
          .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
          .from(intentLogs)
          .where(
            and(
              eq(intentLogs.agentId, agent.id),
              eq(intentLogs.decision, "allowed"),
              gte(intentLogs.createdAt, startOfMonth),
            ),
          )
          .then((rows) => Number(rows[0]?.total ?? 0)),

        db
          .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
          .from(intentLogs)
          .where(and(eq(intentLogs.agentId, agent.id), eq(intentLogs.decision, "allowed")))
          .then((rows) => Number(rows[0]?.total ?? 0)),
      ]);

      const maxDailySpend = policy?.maxDailySpend ?? 0;
      const remainingBudget = Math.max(0, maxDailySpend - daySpend);
      const utilizationPct = maxDailySpend > 0 ? Math.min(100, (daySpend / maxDailySpend) * 100) : 0;

      // Count blocked vs allowed today
      const [blockedToday, allowedToday] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(intentLogs)
          .where(
            and(
              eq(intentLogs.agentId, agent.id),
              eq(intentLogs.decision, "blocked"),
              gte(intentLogs.createdAt, startOfDay),
            ),
          )
          .then((rows) => Number(rows[0]?.count ?? 0)),

        db
          .select({ count: sql<number>`count(*)` })
          .from(intentLogs)
          .where(
            and(
              eq(intentLogs.agentId, agent.id),
              eq(intentLogs.decision, "allowed"),
              gte(intentLogs.createdAt, startOfDay),
            ),
          )
          .then((rows) => Number(rows[0]?.count ?? 0)),
      ]);

      // Top guards triggered today
      const topGuards = await db
        .select({
          guard: intentLogs.guardTriggered,
          count: sql<number>`count(*)`,
        })
        .from(intentLogs)
        .where(
          and(
            eq(intentLogs.agentId, agent.id),
            eq(intentLogs.decision, "blocked"),
            gte(intentLogs.createdAt, startOfDay),
          ),
        )
        .groupBy(intentLogs.guardTriggered)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      return {
        agentId: agent.id,
        agentName: agent.name,
        environment: agent.environment,
        status: agent.status,
        policy: policy
          ? {
              id: policy.id,
              maxDailySpend: policy.maxDailySpend,
              perActionCap: policy.perActionCap,
            }
          : null,
        spend: {
          today: daySpend,
          thisWeek: weekSpend,
          thisMonth: monthSpend,
          allTime: totalSpend,
        },
        budget: {
          remaining: remainingBudget,
          utilizationPct: Math.round(utilizationPct * 100) / 100,
          status:
            utilizationPct >= 100
              ? "exhausted"
              : utilizationPct >= 80
                ? "warning"
                : "healthy",
        },
        activity: {
          allowedToday,
          blockedToday,
          totalToday: allowedToday + blockedToday,
        },
        topGuardsTriggered: topGuards.map((g) => ({
          guard: g.guard ?? "unknown",
          count: Number(g.count),
        })),
      };
    }),
  );

  return c.json({
    organizationId,
    generatedAt: now,
    report,
    summary: {
      totalAgents: orgAgents.length,
      totalSpendToday: report.reduce((s, r) => s + r.spend.today, 0),
      totalSpendThisMonth: report.reduce((s, r) => s + r.spend.thisMonth, 0),
      agentsAtRisk: report.filter((r) => r.budget.status !== "healthy").length,
    },
  });
});

// ── GET /v1/budget/report/:agentId ────────────────────────────────────────────

budgetRouter.get("/report/:agentId", async (c) => {
  const organizationId = c.get("organizationId");
  const agentId = c.req.param("agentId");
  const now = Date.now();

  const agent = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!agent) {
    return c.json({ error: `Agent '${agentId}' not found.` }, 404);
  }

  const startOfDay = getStartOfUtcDayMs(now);

  const policy = await db
    .select()
    .from(policies)
    .where(eq(policies.agentId, agentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const daySpend = await db
    .select({ total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)` })
    .from(intentLogs)
    .where(
      and(
        eq(intentLogs.agentId, agentId),
        eq(intentLogs.decision, "allowed"),
        gte(intentLogs.createdAt, startOfDay),
      ),
    )
    .then((rows) => Number(rows[0]?.total ?? 0));

  const maxDailySpend = policy?.maxDailySpend ?? 0;
  const remainingBudget = Math.max(0, maxDailySpend - daySpend);

  // Hourly breakdown for today
  const hourlyRows = await db
    .select({
      hour: sql<number>`cast(strftime('%H', datetime(${intentLogs.createdAt} / 1000, 'unixepoch')) as integer)`,
      spend: sql<number>`coalesce(sum(${intentLogs.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(intentLogs)
    .where(
      and(
        eq(intentLogs.agentId, agentId),
        eq(intentLogs.decision, "allowed"),
        gte(intentLogs.createdAt, startOfDay),
      ),
    )
    .groupBy(sql`cast(strftime('%H', datetime(${intentLogs.createdAt} / 1000, 'unixepoch')) as integer)`)
    .orderBy(sql`cast(strftime('%H', datetime(${intentLogs.createdAt} / 1000, 'unixepoch')) as integer)`);

  return c.json({
    agentId,
    agentName: agent.name,
    generatedAt: now,
    policy: policy
      ? {
          id: policy.id,
          maxDailySpend: policy.maxDailySpend,
          perActionCap: policy.perActionCap,
        }
      : null,
    today: {
      spent: daySpend,
      remaining: remainingBudget,
      utilizationPct:
        maxDailySpend > 0 ? Math.round((daySpend / maxDailySpend) * 10000) / 100 : 0,
      hourlyBreakdown: hourlyRows.map((r) => ({
        hour: Number(r.hour),
        spend: Number(r.spend),
        count: Number(r.count),
      })),
    },
  });
});

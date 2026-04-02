import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { LimitrumGuard, type VerifyIntentInput } from "@limitrum/sdk";
import { z } from "zod";
import { requireApiKey } from "./middleware/auth.js";
import { agentsRouter } from "./routes/agents.js";
import { policyRouter } from "./routes/policy.js";
import { logsRouter } from "./routes/logs.js";
import { budgetRouter } from "./routes/budget.js";

// ── App setup ─────────────────────────────────────────────────────────────────

type AppVariables = { organizationId: string };
const app = new Hono<{ Variables: AppVariables }>();
const guard = new LimitrumGuard();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    allowHeaders: ["Content-Type", "X-Limitrum-API-Key", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// ── Public routes (no auth) ───────────────────────────────────────────────────

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "limitrum-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }),
);

// ── verify-intent: auth optional (SDK uses it directly) ──────────────────────

const verifyIntentRequestSchema = z.object({
  intent: z.object({
    agentId: z.string().min(1),
    action: z.string().min(1),
    target: z.string().min(1),
    amount: z.number().nonnegative().optional(),
    estimatedCostUsd: z.number().nonnegative().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

app.post("/v1/verify-intent", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verifyIntentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        decision: "blocked",
        reason: "Invalid payload.",
        errors: parsed.error.flatten(),
        traceId: `trace_${Date.now()}`,
      },
      400,
    );
  }

  const result = await guard.verify(parsed.data.intent as VerifyIntentInput);

  return c.json({
    decision: result.decision,
    reason: result.reason,
    traceId: `trace_${Date.now()}`,
    policyId: result.policyId ?? null,
    cumulativeSpent: result.cumulativeSpent,
    remainingBudget: result.remainingBudget,
    guardTriggered: result.guardTriggered ?? null,
  });
});

// ── Protected REST API (requires X-Limitrum-API-Key) ─────────────────────────

const api = new Hono<{ Variables: AppVariables }>();
api.use("*", requireApiKey);

// Mount sub-routers
api.route("/agents", agentsRouter);
api.route("/agents", policyRouter);   // /v1/agents/:id/policy
api.route("/logs", logsRouter);
api.route("/budget", budgetRouter);

app.route("/v1", api);

// ── 404 fallback ──────────────────────────────────────────────────────────────

app.notFound((c) =>
  c.json(
    {
      error: "Not found.",
      hint: "Check the Limitrum API docs at https://docs.limitrum.cloud",
    },
    404,
  ),
);

// ── Error handler ─────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error("[limitrum-api] Unhandled error:", err);
  return c.json(
    {
      error: "Internal server error.",
      message: process.env.NODE_ENV !== "production" ? err.message : undefined,
    },
    500,
  );
});

// ── Start server ──────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? (isProduction ? 8080 : 8000));

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`Limitrum API running on http://localhost:${port}`);
console.log(`  → POST /v1/verify-intent  (public)`);
console.log(`  → GET  /health            (public)`);
console.log(`  → GET  /v1/agents         (auth required)`);
console.log(`  → GET  /v1/logs           (auth required)`);
console.log(`  → GET  /v1/budget/report  (auth required)`);

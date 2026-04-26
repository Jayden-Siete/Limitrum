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
import { apiKeysRouter } from "./routes/apiKeys.js";
import { metricsRouter } from "./routes/metrics.js";

// ── App setup ─────────────────────────────────────────────────────────────────

type AppVariables = { organizationId: string };
const app = new Hono<{ Variables: AppVariables }>();
const guard = new LimitrumGuard();
const isProduction = process.env.NODE_ENV === "production";
const isVerifyIntentPublic =
  process.env.LIMITRUM_VERIFY_INTENT_PUBLIC === "true" || !isProduction;

const configuredCorsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((entry: string) => entry.trim())
  .filter(Boolean);

const corsOrigin =
  configuredCorsOrigins.length > 0
    ? configuredCorsOrigins
    : isProduction
      ? "https://limitrum.com"
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

function validateProductionEnvironment() {
  if (!isProduction) return;

  const errors: string[] = [];
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const masterKey = process.env.LIMITRUM_MASTER_API_KEY ?? process.env.LIMITRUM_MASTER_KEY ?? "";

  if (process.env.LIMITRUM_VERIFY_INTENT_PUBLIC === "true") {
    errors.push("LIMITRUM_VERIFY_INTENT_PUBLIC must not be true in production.");
  }
  if (configuredCorsOrigins.length === 0) {
    errors.push("CORS_ORIGIN must be set to one or more trusted origins in production.");
  }
  if (configuredCorsOrigins.some((origin) => /localhost|127\.0\.0\.1|\[?::1\]?/.test(origin))) {
    errors.push("CORS_ORIGIN must not include localhost origins in production.");
  }
  if (!databaseUrl || databaseUrl.startsWith("file:") || databaseUrl.endsWith(".sqlite")) {
    errors.push("DATABASE_URL must point to durable remote storage in production.");
  }
  if (!masterKey || masterKey === "limitrum-master-dev" || masterKey.length < 32) {
    errors.push("LIMITRUM_MASTER_API_KEY must be set to a strong production secret.");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
  }
}

validateProductionEnvironment();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigin,
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
  if (!isVerifyIntentPublic) {
    let authenticated = false;
    const authResponse = await requireApiKey(c, async () => {
      authenticated = true;
    });
    if (!authenticated) {
      return authResponse;
    }
  }

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
    allowed: result.allowed,
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
api.route("/metrics", metricsRouter);
api.route("/api-keys", apiKeysRouter);

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

const port = Number(process.env.PORT ?? (isProduction ? 8080 : 8000));

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`Limitrum API running on http://localhost:${port}`);
console.log(
  `  → POST /v1/verify-intent  (${isVerifyIntentPublic ? "public" : "auth required"})`,
);
console.log(`  → GET  /health            (public)`);
console.log(`  → GET  /v1/agents         (auth required)`);
console.log(`  → GET  /v1/logs           (auth required)`);
console.log(`  → GET  /v1/budget/report  (auth required)`);
console.log(`  → POST /v1/api-keys       (auth required)`);
console.log(`  → GET  /v1/api-keys       (auth required)`);
console.log(`  → DEL  /v1/api-keys/:id   (auth required)`);

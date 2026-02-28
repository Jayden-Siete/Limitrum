import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { LimitrumGuard, type VerifyIntentInput } from "@limitrum/sdk";

const app = new Hono();
const guard = new LimitrumGuard();

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "limitrum-api" }));

app.post("/v1/verify-intent", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || !("intent" in body)) {
    return c.json(
      {
        decision: "blocked",
        reason: "Invalid payload. Expected { intent: {...} }.",
        traceId: `trace_${Date.now()}`,
      },
      400,
    );
  }

  const result = guard.verify((body as { intent: VerifyIntentInput }).intent);
  return c.json({
    decision: result.allowed ? "allowed" : "blocked",
    reason: result.reason,
    traceId: `trace_${Date.now()}`,
    policyId: result.policyId ?? null,
  });
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`Limitrum API running on http://localhost:${port}`);

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { LimitrumGuard, type VerifyIntentInput } from "@limitrum/sdk";
import { z } from "zod";

const app = new Hono();
const guard = new LimitrumGuard();
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

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "limitrum-api" }));

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
  });
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`Limitrum API running on http://localhost:${port}`);

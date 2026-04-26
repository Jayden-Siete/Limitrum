import { randomUUID, createHash } from "node:crypto";
import { Hono } from "hono";
import { db, apiKeys, organizations, eq, and } from "@limitrum/db";
import { z } from "zod";

export const apiKeysRouter = new Hono<{ Variables: { organizationId: string } }>();

// ── Validation schemas ────────────────────────────────────────────────────────

const createApiKeySchema = z.object({
  label: z.string().min(1).max(128),
  expiresAt: z.number().int().positive().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateApiKey(): string {
  const raw = randomUUID().replace(/-/g, "");
  return `lmt_${raw}`;
}

// ── POST /v1/api-keys ─────────────────────────────────────────────────────────

apiKeysRouter.post("/", async (c) => {
  const organizationId = c.get("organizationId");
  const body = await c.req.json().catch(() => null);
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid payload.", details: parsed.error.flatten() }, 400);
  }

  // Ensure the organization exists
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!org) {
    return c.json({ error: `Organization '${organizationId}' not found.` }, 404);
  }

  const now = Date.now();
  const plainKey = generateApiKey();
  const keyHash = hashKey(plainKey);
  const keyId = `key_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

  await db.insert(apiKeys).values({
    id: keyId,
    organizationId,
    keyHash,
    label: parsed.data.label,
    expiresAt: parsed.data.expiresAt ?? null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: now,
  });

  // Return the plaintext key ONCE — it cannot be retrieved again
  return c.json(
    {
      id: keyId,
      key: plainKey,
      label: parsed.data.label,
      organizationId,
      expiresAt: parsed.data.expiresAt ?? null,
      createdAt: now,
      warning: "Store this key securely. It will not be shown again.",
    },
    201,
  );
});

// ── GET /v1/api-keys ──────────────────────────────────────────────────────────

apiKeysRouter.get("/", async (c) => {
  const organizationId = c.get("organizationId");

  const rows = await db
    .select({
      id: apiKeys.id,
      organizationId: apiKeys.organizationId,
      label: apiKeys.label,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, organizationId))
    .orderBy(apiKeys.createdAt);

  const now = Date.now();
  const enriched = rows.map((key) => ({
    ...key,
    expired: key.expiresAt !== null && key.expiresAt < now,
    revoked: key.revokedAt !== null,
  }));

  return c.json({ apiKeys: enriched, total: enriched.length });
});

// ── GET /v1/api-keys/:id ──────────────────────────────────────────────────────

apiKeysRouter.get("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const keyId = c.req.param("id");

  const key = await db
    .select({
      id: apiKeys.id,
      organizationId: apiKeys.organizationId,
      label: apiKeys.label,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!key) {
    return c.json({ error: `API key '${keyId}' not found.` }, 404);
  }

  const now = Date.now();
  return c.json({
    ...key,
    expired: key.expiresAt !== null && key.expiresAt < now,
    revoked: key.revokedAt !== null,
  });
});

// ── DELETE /v1/api-keys/:id ───────────────────────────────────────────────────

apiKeysRouter.post("/:id/rotate", async (c) => {
  const organizationId = c.get("organizationId");
  const keyId = c.req.param("id");

  const existing = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return c.json({ error: `API key '${keyId}' not found.` }, 404);
  }

  const now = Date.now();
  const plainKey = generateApiKey();
  const keyHash = hashKey(plainKey);

  await db
    .update(apiKeys)
    .set({
      keyHash,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: now,
    })
    .where(eq(apiKeys.id, keyId));

  return c.json({
    id: keyId,
    key: plainKey,
    label: existing.label,
    organizationId,
    expiresAt: existing.expiresAt,
    createdAt: now,
    warning: "Store this rotated key securely. It will not be shown again.",
  });
});

apiKeysRouter.post("/:id/revoke", async (c) => {
  const organizationId = c.get("organizationId");
  const keyId = c.req.param("id");

  const existing = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return c.json({ error: `API key '${keyId}' not found.` }, 404);
  }

  const revokedAt = existing.revokedAt ?? Date.now();
  await db.update(apiKeys).set({ revokedAt }).where(eq(apiKeys.id, keyId));

  return c.json({ revoked: true, keyId, revokedAt });
});

apiKeysRouter.delete("/:id", async (c) => {
  const organizationId = c.get("organizationId");
  const keyId = c.req.param("id");

  const existing = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return c.json({ error: `API key '${keyId}' not found.` }, 404);
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

  return c.json({ deleted: true, keyId });
});

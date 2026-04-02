import { createHash } from "node:crypto";
import type { Context, Next } from "hono";
import { db, apiKeys, eq } from "@limitrum/db";

/**
 * Hash an API key the same way it was stored during creation.
 */
function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Hono middleware that validates X-Limitrum-API-Key header.
 *
 * Skips auth for:
 *  - GET /health
 *  - Any route when LIMITRUM_MASTER_API_KEY env matches (admin bypass)
 */
export async function requireApiKey(c: Context, next: Next) {
  const raw = c.req.header("X-Limitrum-API-Key") ?? c.req.header("Authorization")?.replace(/^Bearer\s+/, "");

  if (!raw) {
    return c.json({ error: "Missing API key. Provide X-Limitrum-API-Key header." }, 401);
  }

  // Master key bypass (for admin / seeding operations)
  const masterKey = process.env.LIMITRUM_MASTER_API_KEY;
  if (masterKey && raw === masterKey) {
    c.set("organizationId", "org_master");
    await next();
    return;
  }

  const keyHash = hashKey(raw);
  const now = Date.now();

  const found = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1)
    .then((rows) => rows[0]);

  if (!found) {
    return c.json({ error: "Invalid API key." }, 401);
  }

  if (found.expiresAt !== null && found.expiresAt < now) {
    return c.json({ error: "API key has expired." }, 401);
  }

  c.set("organizationId", found.organizationId);
  await next();
}

import { fileURLToPath } from "node:url";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const thisFilePath = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFilePath);
const repoRootDbPath = path.resolve(thisDir, "../../../limitrum.sqlite");
const dbSource = process.env.DATABASE_URL ?? process.env.LIMITRUM_DB_PATH ?? repoRootDbPath;
const isRemoteLibsql = dbSource.startsWith("libsql://") || dbSource.startsWith("https://") || dbSource.startsWith("http://");

// Local file path mode uses file:// URL (embedded/local libsql mode).
const sqliteUrl = isRemoteLibsql
  ? dbSource
  : dbSource.startsWith("file:")
    ? dbSource
    : pathToFileURL(path.resolve(dbSource)).toString();

export const sqlite = createClient({
  url: sqliteUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(sqlite, { schema });

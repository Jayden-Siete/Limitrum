import { fileURLToPath } from "node:url";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const thisFilePath = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFilePath);
const repoRootDbPath = path.resolve(thisDir, "../../../limitrum.sqlite");
const dbSource = process.env.LIMITRUM_DB_PATH ?? repoRootDbPath;
const sqliteUrl =
  dbSource.startsWith("file:") || dbSource.startsWith("http")
    ? dbSource
    : pathToFileURL(path.resolve(dbSource)).toString();

export const sqlite = createClient({ url: sqliteUrl });

export const db = drizzle(sqlite, { schema });

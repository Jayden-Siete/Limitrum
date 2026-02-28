import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const sqlitePath = process.env.LIMITRUM_DB_PATH ?? "./limitrum.sqlite";
const sqlite = new Database(sqlitePath);

export const db = drizzle(sqlite, { schema });

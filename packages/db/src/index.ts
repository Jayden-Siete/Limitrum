export * from "./client.js";
export * from "./schema.js";
export { bootstrapSchema } from "./migrate.js";

// Re-export commonly used drizzle-orm operators so consumers don't need
// a separate drizzle-orm dependency (avoids version mismatch in monorepo).
export { and, eq, gte, lte, lt, gt, ne, desc, asc, sql, count, sum, avg, inArray, notInArray, isNull, isNotNull, like, notLike, between, or, not } from "drizzle-orm";

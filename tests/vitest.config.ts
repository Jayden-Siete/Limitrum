import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["../packages/sdk/src/**", "../apps/api/src/**"],
      exclude: ["**/node_modules/**", "**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@limitrum/sdk": path.resolve(rootDir, "../packages/sdk/src/index.ts"),
      "@limitrum/db": path.resolve(rootDir, "../packages/db/src/index.ts"),
    },
  },
});

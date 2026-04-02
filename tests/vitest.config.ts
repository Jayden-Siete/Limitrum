import { defineConfig } from "vitest/config";

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
      "@limitrum/sdk": "../packages/sdk/src/index.ts",
      "@limitrum/db": "../packages/db/src/index.ts",
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    include: ["integration/**/*.test.ts"],
    environment: "node",
    globals: false,
    // Integration tests hit a live server — allow longer timeouts
    testTimeout: 15_000,
    hookTimeout: 10_000,
    // Run sequentially to avoid race conditions on shared DB state
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
    reporters: ["verbose"],
  },
  resolve: {
    conditions: ["node"],
  },
});

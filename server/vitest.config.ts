import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const testDb = `file:${path.join(dir, "prisma", "test.db")}`;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    env: {
      DATABASE_URL: testDb,
      JWT_SECRET: "test-secret-do-not-use-in-production",
    },
    globalSetup: ["./tests/globalSetup.ts"],
    // SQLite is single-writer; run tests in one fork to avoid write contention.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});

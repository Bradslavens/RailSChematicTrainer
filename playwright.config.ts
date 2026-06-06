import { defineConfig } from "@playwright/test";
import path from "node:path";

const dir = __dirname;
const E2E_DB = `file:${path.join(dir, "server", "prisma", "e2e.db")}`;
const JWT_SECRET = "e2e-secret-not-for-prod";
const API_PORT = 4101;
const WEB_PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  // Use the system-installed Google Chrome (no Playwright browser download needed).
  use: { baseURL: `http://localhost:${WEB_PORT}`, channel: "chrome", trace: "on-first-retry" },
  webServer: [
    {
      command: "node --import tsx src/index.ts",
      cwd: path.join(dir, "server"),
      env: { DATABASE_URL: E2E_DB, JWT_SECRET, PORT: String(API_PORT) },
      port: API_PORT,
      reuseExistingServer: false,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: `npm run dev -- --port ${WEB_PORT} --strictPort`,
      cwd: path.join(dir, "web"),
      env: { VITE_API_PROXY: `http://localhost:${API_PORT}` },
      port: WEB_PORT,
      reuseExistingServer: false,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});

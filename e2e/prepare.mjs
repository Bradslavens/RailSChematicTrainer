// Prepare a clean, seeded SQLite database for the e2e run. Runs before Playwright
// starts the servers, so ordering is deterministic.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(dir, "..", "server");
const dbFile = path.join(serverRoot, "prisma", "e2e.db");

const env = {
  ...process.env,
  DATABASE_URL: `file:${dbFile}`,
  JWT_SECRET: "e2e-secret-not-for-prod",
  ADMIN_EMAIL: "admin@rail.test",
  ADMIN_PASSWORD: "admin12345",
};

for (const f of [dbFile, `${dbFile}-journal`]) {
  try {
    rmSync(f);
  } catch {
    /* not present */
  }
}

execSync("npx prisma db push --skip-generate", { cwd: serverRoot, env, stdio: "inherit" });
execSync("node --import tsx src/seed.ts", { cwd: serverRoot, env, stdio: "inherit" });
console.log("e2e database ready");

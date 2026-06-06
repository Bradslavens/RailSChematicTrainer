import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(dir, "..");
const testDb = `file:${path.join(serverRoot, "prisma", "test.db")}`;

/** Create a fresh test database schema once before the suite runs. */
export default function setup() {
  execSync("npx prisma db push --skip-generate", {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: testDb },
    stdio: "inherit",
  });
}

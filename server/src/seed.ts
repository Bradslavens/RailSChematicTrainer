import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./db.js";
import { registerUser, UserError } from "./services/userService.js";
import { createSchematicFromJson } from "./services/schematicService.js";
import { registerSchema } from "./domain/auth.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(dir, "..", "seed");

async function ensureAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@rail.test";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";

  // Make sure the admin can actually log in (same rules the login route enforces).
  const check = registerSchema.safeParse({ email, password });
  if (!check.success) {
    throw new Error(`Invalid admin credentials: ${check.error.issues[0]?.message}`);
  }

  try {
    await registerUser(email, password, "admin");
    console.log(`✔ created admin account  ${email} / ${password}`);
    console.log("  (set ADMIN_EMAIL / ADMIN_PASSWORD to override; change it after first login)");
  } catch (err) {
    if (err instanceof UserError && err.code === "EMAIL_TAKEN") {
      console.log(`• admin account ${email} already exists`);
    } else {
      throw err;
    }
  }
}

async function seedSchematics(): Promise<void> {
  const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const json = JSON.parse(readFileSync(path.join(seedDir, file), "utf8"));
    const existing = await prisma.schematic.findFirst({ where: { name: json.name } });
    if (existing) {
      console.log(`• schematic "${json.name}" already present — skipping`);
      continue;
    }
    const created = await createSchematicFromJson(json);
    console.log(`✔ seeded "${created.name}" with ${created.points.length} points`);
  }
}

async function main(): Promise<void> {
  await ensureAdmin();
  await seedSchematics();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

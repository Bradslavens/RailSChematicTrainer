import { prisma } from "../../src/db.js";

/** Delete all rows in FK-safe order. Call in beforeEach for DB-backed tests. */
export async function resetDb(): Promise<void> {
  await prisma.attempt.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.point.deleteMany();
  await prisma.track.deleteMany();
  await prisma.schematic.deleteMany();
  await prisma.user.deleteMany();
}

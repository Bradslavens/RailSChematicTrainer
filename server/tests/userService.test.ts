import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import {
  registerUser,
  authenticateUser,
  getUserById,
  UserError,
} from "../src/services/userService.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("registerUser", () => {
  it("creates a learner with a hashed password and a stats row", async () => {
    const user = await registerUser("New@Example.com", "password123");
    expect(user.email).toBe("new@example.com"); // normalized
    expect(user.role).toBe("learner");
    expect(user.passwordHash).not.toBe("password123");

    const stats = await prisma.userStats.findUnique({ where: { userId: user.id } });
    expect(stats).not.toBeNull();
  });

  it("can create an admin", async () => {
    const user = await registerUser("admin@example.com", "password123", "admin");
    expect(user.role).toBe("admin");
  });

  it("rejects a duplicate email (case-insensitive)", async () => {
    await registerUser("dup@example.com", "password123");
    await expect(registerUser("DUP@example.com", "password123")).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
  });
});

describe("authenticateUser", () => {
  it("returns the user for correct credentials", async () => {
    await registerUser("a@example.com", "password123");
    const user = await authenticateUser("A@example.com", "password123");
    expect(user.email).toBe("a@example.com");
  });

  it("throws INVALID_CREDENTIALS for a wrong password", async () => {
    await registerUser("a@example.com", "password123");
    await expect(authenticateUser("a@example.com", "nope")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("throws INVALID_CREDENTIALS for an unknown email", async () => {
    await expect(authenticateUser("ghost@example.com", "password123")).rejects.toBeInstanceOf(
      UserError,
    );
  });
});

describe("getUserById", () => {
  it("finds a user, or returns null", async () => {
    const created = await registerUser("a@example.com", "password123");
    expect((await getUserById(created.id))?.email).toBe("a@example.com");
    expect(await getUserById("missing")).toBeNull();
  });
});

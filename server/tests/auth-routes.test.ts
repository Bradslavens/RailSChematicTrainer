import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { createApp } from "../src/app.js";
import { registerUser } from "../src/services/userService.js";
import { signToken } from "../src/domain/auth.js";

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: "new@example.com", role: "learner" });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser("dup@example.com", "password123");
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    await registerUser("a@example.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("returns 401 for a wrong password", async () => {
    await registerUser("a@example.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user with a valid token", async () => {
    const user = await registerUser("a@example.com", "password123");
    const token = signToken({ userId: user.id, role: "learner" }, process.env.JWT_SECRET!);
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("a@example.com");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer nonsense");
    expect(res.status).toBe(401);
  });
});

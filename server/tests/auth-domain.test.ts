import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  registerSchema,
  loginSchema,
} from "../src/domain/auth.js";

describe("password hashing", () => {
  it("hashes to something other than the plaintext", async () => {
    const hash = await hashPassword("hunter2pass");
    expect(hash).not.toBe("hunter2pass");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("hunter2pass");
    expect(await verifyPassword("hunter2pass", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("hunter2pass");
    expect(await verifyPassword("wrongpass", hash)).toBe(false);
  });
});

describe("JWT tokens", () => {
  const secret = "unit-test-secret";

  it("round-trips the payload", () => {
    const token = signToken({ userId: "u1", role: "admin" }, secret);
    const payload = verifyToken(token, secret);
    expect(payload.userId).toBe("u1");
    expect(payload.role).toBe("admin");
  });

  it("rejects a token signed with a different secret", () => {
    const token = signToken({ userId: "u1", role: "learner" }, secret);
    expect(() => verifyToken(token, "other-secret")).toThrow();
  });

  it("rejects a tampered token", () => {
    const token = signToken({ userId: "u1", role: "learner" }, secret);
    expect(() => verifyToken(token + "x", secret)).toThrow();
  });
});

describe("registerSchema", () => {
  it("accepts a valid email and password", () => {
    const r = registerSchema.safeParse({ email: "a@b.com", password: "longenough" });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ email: "nope", password: "longenough" }).success).toBe(false);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

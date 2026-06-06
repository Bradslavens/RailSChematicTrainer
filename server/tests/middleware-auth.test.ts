import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth, requireAdmin } from "../src/middleware/auth.js";
import { signToken } from "../src/domain/auth.js";

function appWithGuards() {
  const app = express();
  app.get("/protected", requireAuth, (_req, res) => res.json({ ok: true }));
  app.get("/admin", requireAuth, requireAdmin, (_req, res) => res.json({ ok: true }));
  return app;
}

const secret = process.env.JWT_SECRET!;

describe("requireAuth", () => {
  it("allows a request with a valid token", async () => {
    const token = signToken({ userId: "u1", role: "learner" }, secret);
    const res = await request(appWithGuards()).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("blocks a request with no token", async () => {
    expect((await request(appWithGuards()).get("/protected")).status).toBe(401);
  });
});

describe("requireAdmin", () => {
  it("allows an admin", async () => {
    const token = signToken({ userId: "u1", role: "admin" }, secret);
    const res = await request(appWithGuards()).get("/admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids a learner with 403", async () => {
    const token = signToken({ userId: "u1", role: "learner" }, secret);
    const res = await request(appWithGuards()).get("/admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

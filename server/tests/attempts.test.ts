import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { createApp } from "../src/app.js";
import { registerUser } from "../src/services/userService.js";
import { createSchematicFromJson } from "../src/services/schematicService.js";
import { recordAttempt, attemptSummary } from "../src/services/attemptService.js";
import { NotFoundError } from "../src/services/schematicService.js";
import { signToken } from "../src/domain/auth.js";

const app = createApp();
const secret = process.env.JWT_SECRET!;

const sample = {
  name: "Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", polyline: [[365, 40], [365, 910]] }],
  points: [{ type: "signal", label: "E18LA", x: 345, y: 95, track: "left" }],
};

async function setup() {
  const user = await registerUser("a@example.com", "password123");
  const schematic = await createSchematicFromJson(sample);
  return { user, pointId: schematic.points[0].id, token: signToken({ userId: user.id, role: "learner" }, secret) };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("recordAttempt service", () => {
  it("records an attempt", async () => {
    const { user, pointId } = await setup();
    const a = await recordAttempt(user.id, { pointId, gameMode: "pin-drop", correct: true, responseMs: 1200 });
    expect(a.correct).toBe(true);
    expect(await prisma.attempt.count()).toBe(1);
  });

  it("rejects an unknown point", async () => {
    const { user } = await setup();
    await expect(
      recordAttempt(user.id, { pointId: "ghost", gameMode: "pin-drop", correct: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("attemptSummary", () => {
  it("computes accuracy", async () => {
    const { user, pointId } = await setup();
    await recordAttempt(user.id, { pointId, gameMode: "pin-drop", correct: true });
    await recordAttempt(user.id, { pointId, gameMode: "pin-drop", correct: false });
    await recordAttempt(user.id, { pointId, gameMode: "pin-drop", correct: true });
    const s = await attemptSummary(user.id, "pin-drop");
    expect(s).toEqual({ total: 3, correct: 2, accuracy: 2 / 3 });
  });
});

describe("POST /api/attempts", () => {
  it("records for an authenticated user (201)", async () => {
    const { token, pointId } = await setup();
    const res = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ pointId, gameMode: "pin-drop", correct: true, responseMs: 900 });
    expect(res.status).toBe(201);
    expect(res.body.attempt.id).toBeTruthy();
  });

  it("requires auth (401)", async () => {
    const { pointId } = await setup();
    const res = await request(app).post("/api/attempts").send({ pointId, gameMode: "pin-drop", correct: true });
    expect(res.status).toBe(401);
  });

  it("validates the body (400)", async () => {
    const { token } = await setup();
    const res = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ pointId: "x", gameMode: "not-a-mode", correct: true });
    expect(res.status).toBe(400);
  });

  it("404s for an unknown point", async () => {
    const { token } = await setup();
    const res = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ pointId: "ghost", gameMode: "pin-drop", correct: true });
    expect(res.status).toBe(404);
  });
});

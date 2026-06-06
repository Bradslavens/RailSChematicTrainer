import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { createApp } from "../src/app.js";
import { registerUser } from "../src/services/userService.js";
import { createSchematicFromJson } from "../src/services/schematicService.js";
import { signToken } from "../src/domain/auth.js";

const app = createApp();
const secret = process.env.JWT_SECRET!;

const sample = {
  name: "Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", polyline: [[365, 40], [365, 910]] }],
  points: [
    { type: "signal", label: "E18LA", x: 345, y: 95, track: "left" },
    { type: "signal", label: "E1221", x: 340, y: 310, track: "left" },
  ],
};

async function setup() {
  const user = await registerUser("a@example.com", "password123");
  const schematic = await createSchematicFromJson(sample);
  return { token: signToken({ userId: user.id, role: "learner" }, secret), schematic };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("attempt outcome response", () => {
  it("returns updated stats with the attempt", async () => {
    const { token, schematic } = await setup();
    const res = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ pointId: schematic.points[0].id, gameMode: "pin-drop", correct: true });
    expect(res.status).toBe(201);
    expect(res.body.stats.xp).toBe(10);
    expect(res.body.stats.level).toBe(1);
  });
});

describe("GET /api/stats/me & leaderboard", () => {
  it("requires auth", async () => {
    expect((await request(app).get("/api/stats/me")).status).toBe(401);
  });
  it("returns the current user's stats and the leaderboard", async () => {
    const { token, schematic } = await setup();
    await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ pointId: schematic.points[0].id, gameMode: "pin-drop", correct: true });

    const me = await request(app).get("/api/stats/me").set("Authorization", `Bearer ${token}`);
    expect(me.body.stats.xp).toBe(10);

    const board = await request(app).get("/api/stats/leaderboard").set("Authorization", `Bearer ${token}`);
    expect(board.body.leaderboard[0].email).toBe("a@example.com");
  });
});

describe("GET /api/progress/due", () => {
  it("lists due point ids for a schematic", async () => {
    const { token, schematic } = await setup();
    const res = await request(app)
      .get(`/api/progress/due?schematicId=${schematic.id}&types=signal`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pointIds).toHaveLength(2);
  });

  it("400s without a schematicId", async () => {
    const { token } = await setup();
    expect(
      (await request(app).get("/api/progress/due").set("Authorization", `Bearer ${token}`)).status,
    ).toBe(400);
  });
});

describe("GET /api/stats/mastery", () => {
  it("returns mastery rows for a schematic", async () => {
    const { token, schematic } = await setup();
    const res = await request(app)
      .get(`/api/stats/mastery?schematicId=${schematic.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mastery.find((m: { type: string }) => m.type === "signal").total).toBe(2);
  });
});

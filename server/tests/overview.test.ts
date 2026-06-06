import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { createApp } from "../src/app.js";
import { registerUser } from "../src/services/userService.js";
import { createSchematicFromJson } from "../src/services/schematicService.js";
import { applyAttemptOutcome } from "../src/services/statsService.js";
import { attemptOverview } from "../src/services/attemptService.js";
import { signToken } from "../src/domain/auth.js";

const sample = {
  name: "Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", polyline: [[365, 40], [365, 910]] }],
  points: [{ type: "signal", label: "E18LA", x: 345, y: 95, track: "left" }],
};

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("attemptOverview", () => {
  it("breaks accuracy down by game mode", async () => {
    const user = await registerUser("a@example.com", "password123");
    const schematic = await createSchematicFromJson(sample);
    const pid = schematic.points[0].id;
    await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "pin-drop", correct: true });
    await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "pin-drop", correct: false });
    await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "name-it", correct: true });

    const ov = await attemptOverview(user.id);
    expect(ov.overall).toMatchObject({ total: 3, correct: 2 });
    expect(ov.byMode.find((m) => m.mode === "pin-drop")).toMatchObject({ total: 2, correct: 1, accuracy: 0.5 });
    expect(ov.byMode.find((m) => m.mode === "name-it")).toMatchObject({ total: 1, correct: 1 });
    expect(ov.byMode.find((m) => m.mode === "flashcard")).toMatchObject({ total: 0, accuracy: 0 });
  });

  it("is served at GET /api/stats/overview", async () => {
    const user = await registerUser("a@example.com", "password123");
    const token = signToken({ userId: user.id, role: "learner" }, process.env.JWT_SECRET!);
    const res = await request(createApp()).get("/api/stats/overview").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.overview.byMode).toHaveLength(4);
  });
});

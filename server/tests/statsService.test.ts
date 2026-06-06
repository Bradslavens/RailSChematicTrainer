import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { registerUser } from "../src/services/userService.js";
import { createSchematicFromJson } from "../src/services/schematicService.js";
import {
  applyAttemptOutcome,
  getMyStats,
  getLeaderboard,
  getMastery,
  getDuePoints,
} from "../src/services/statsService.js";

const sample = {
  name: "Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", polyline: [[365, 40], [365, 910]] }],
  points: [
    { type: "signal", label: "E18LA", x: 345, y: 95, track: "left" },
    { type: "signal", label: "E1221", x: 340, y: 310, track: "left" },
    { type: "station", label: "La Mesa Blvd", x: 430, y: 255 },
  ],
};

async function setup() {
  const user = await registerUser("a@example.com", "password123");
  const schematic = await createSchematicFromJson(sample);
  return { user, schematic };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("applyAttemptOutcome", () => {
  it("awards xp, starts a streak, and creates SRS progress", async () => {
    const { user, schematic } = await setup();
    const now = Date.parse("2026-06-06T12:00:00Z");
    const out = await applyAttemptOutcome(
      user.id,
      { pointId: schematic.points[0].id, gameMode: "pin-drop", correct: true },
      now,
    );
    expect(out.stats.xp).toBe(10);
    expect(out.stats.currentStreak).toBe(1);

    const progress = await prisma.progress.findFirst({ where: { userId: user.id } });
    expect(progress?.srsBox).toBe(1);
  });

  it("levels up after enough correct answers", async () => {
    const { user, schematic } = await setup();
    const pid = schematic.points[0].id;
    let leveled = false;
    for (let i = 0; i < 10; i++) {
      const out = await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "pin-drop", correct: true });
      leveled = leveled || out.leveledUp;
    }
    const stats = await getMyStats(user.id);
    expect(stats.xp).toBe(100);
    expect(stats.level).toBe(2);
    expect(leveled).toBe(true);
  });
});

describe("leaderboard", () => {
  it("ranks users by xp", async () => {
    const { user, schematic } = await setup();
    const other = await registerUser("b@example.com", "password123");
    await applyAttemptOutcome(user.id, { pointId: schematic.points[0].id, gameMode: "pin-drop", correct: true });
    await applyAttemptOutcome(other.id, { pointId: schematic.points[0].id, gameMode: "pin-drop", correct: false });

    const board = await getLeaderboard();
    expect(board[0].email).toBe("a@example.com");
    expect(board[0].xp).toBeGreaterThan(board[1].xp);
  });
});

describe("mastery", () => {
  it("summarizes mastery per type", async () => {
    const { user, schematic } = await setup();
    // master E18LA fully (6 correct -> box 5 -> mastery 1)
    const pid = schematic.points[0].id;
    for (let i = 0; i < 6; i++) {
      await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "flashcard", correct: true });
    }
    const mastery = await getMastery(user.id, schematic.id);
    const signals = mastery.find((m) => m.type === "signal")!;
    expect(signals.total).toBe(2);
    expect(signals.mastered).toBe(1);
    expect(mastery.find((m) => m.type === "station")!.avgMastery).toBe(0);
  });
});

describe("getDuePoints", () => {
  it("returns all points as due when nothing has been studied", async () => {
    const { user, schematic } = await setup();
    const due = await getDuePoints(user.id, schematic.id, { types: ["signal"] });
    expect(due).toHaveLength(2);
  });

  it("excludes points that were just answered correctly (not yet due)", async () => {
    const { user, schematic } = await setup();
    const pid = schematic.points[0].id;
    const now = Date.parse("2026-06-06T12:00:00Z");
    await applyAttemptOutcome(user.id, { pointId: pid, gameMode: "flashcard", correct: true }, now);
    const due = await getDuePoints(user.id, schematic.id, { types: ["signal"], nowMs: now });
    expect(due).not.toContain(pid);
    expect(due).toHaveLength(1);
  });
});

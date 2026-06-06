import { describe, it, expect } from "vitest";
import { levelForXp, xpForResult, levelProgress, nextStreak, dayStr } from "../src/domain/stats.js";
import { nextReview, MAX_BOX } from "../src/domain/srs.js";

describe("levels & xp", () => {
  it("maps xp to levels", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(250)).toBe(3);
  });
  it("awards more xp for correct answers", () => {
    expect(xpForResult(true)).toBeGreaterThan(xpForResult(false));
  });
  it("reports progress within the level", () => {
    expect(levelProgress(120)).toEqual({ level: 2, intoLevel: 20, perLevel: 100 });
  });
});

describe("nextStreak", () => {
  const base = { lastStudyDay: null, currentStreak: 0, longestStreak: 0 };
  it("starts a streak on first activity", () => {
    expect(nextStreak(base, "2026-06-06")).toMatchObject({ currentStreak: 1, longestStreak: 1 });
  });
  it("is a no-op for same-day activity", () => {
    const s = { lastStudyDay: "2026-06-06", currentStreak: 3, longestStreak: 5 };
    expect(nextStreak(s, "2026-06-06")).toBe(s);
  });
  it("increments on consecutive days", () => {
    const s = { lastStudyDay: "2026-06-06", currentStreak: 3, longestStreak: 5 };
    expect(nextStreak(s, "2026-06-07")).toMatchObject({ currentStreak: 4, longestStreak: 5 });
  });
  it("resets after a gap, keeping the longest", () => {
    const s = { lastStudyDay: "2026-06-06", currentStreak: 9, longestStreak: 9 };
    expect(nextStreak(s, "2026-06-10")).toMatchObject({ currentStreak: 1, longestStreak: 9 });
  });
  it("derives the UTC day string", () => {
    expect(dayStr(Date.parse("2026-06-06T23:00:00Z"))).toBe("2026-06-06");
  });
});

describe("nextReview (SRS)", () => {
  const now = 1_000_000_000_000;
  it("promotes the box on a correct answer and raises mastery", () => {
    const r = nextReview({ box: 0, streak: 0 }, true, now);
    expect(r.box).toBe(1);
    expect(r.streak).toBe(1);
    expect(r.mastery).toBeCloseTo(1 / MAX_BOX);
    expect(r.dueAt).toBeGreaterThan(now);
  });
  it("resets to box 0 on a wrong answer", () => {
    const r = nextReview({ box: 3, streak: 4 }, false, now);
    expect(r.box).toBe(0);
    expect(r.streak).toBe(0);
  });
  it("caps at the maximum box", () => {
    const r = nextReview({ box: MAX_BOX, streak: 9 }, true, now);
    expect(r.box).toBe(MAX_BOX);
    expect(r.mastery).toBe(1);
  });
});

import { describe, it, expect } from "vitest";
import { gradeTap, buildQuestions } from "../src/games/pinDrop.js";

describe("gradeTap", () => {
  const target = { x: 100, y: 100 };

  it("scores an exact tap as perfect and correct", () => {
    const g = gradeTap({ x: 100, y: 100 }, target);
    expect(g).toMatchObject({ correct: true, level: "perfect", points: 100, distance: 0 });
  });

  it("scores a near miss as close (partial credit, not correct)", () => {
    const g = gradeTap({ x: 100, y: 150 }, target); // 50 away
    expect(g.level).toBe("close");
    expect(g.correct).toBe(false);
    expect(g.points).toBe(40);
  });

  it("scores a far tap as a miss", () => {
    const g = gradeTap({ x: 100, y: 300 }, target); // 200 away
    expect(g).toMatchObject({ correct: false, level: "miss", points: 0 });
  });

  it("respects custom thresholds", () => {
    const g = gradeTap({ x: 100, y: 110 }, target, { perfectWithin: 5 });
    expect(g.level).toBe("close");
  });
});

describe("buildQuestions", () => {
  it("returns at most count items", () => {
    expect(buildQuestions([1, 2, 3, 4, 5], 3)).toHaveLength(3);
  });

  it("returns all items when count exceeds length", () => {
    expect(buildQuestions([1, 2], 10)).toHaveLength(2);
  });

  it("keeps the same set of items (no duplicates/drops)", () => {
    const out = buildQuestions([1, 2, 3, 4], 4, () => 0.5);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });

  it("uses the rng to order deterministically", () => {
    const out = buildQuestions(["a", "b", "c"], 3, () => 0);
    expect(out).toHaveLength(3);
  });
});

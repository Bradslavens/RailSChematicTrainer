import { describe, it, expect } from "vitest";
import { pickDaily, seedFromDate, dailyDateStr } from "../src/games/daily.js";

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("pickDaily", () => {
  it("is deterministic for a given date", () => {
    expect(pickDaily(items, 5, "2026-06-06")).toEqual(pickDaily(items, 5, "2026-06-06"));
  });

  it("returns the requested count", () => {
    expect(pickDaily(items, 5, "2026-06-06")).toHaveLength(5);
  });

  it("usually differs across dates", () => {
    const a = pickDaily(items, 5, "2026-06-06").join(",");
    const b = pickDaily(items, 5, "2026-06-07").join(",");
    expect(a).not.toBe(b);
  });

  it("only picks from the provided items", () => {
    const set = new Set(items);
    expect(pickDaily(items, 5, "2026-06-06").every((x) => set.has(x))).toBe(true);
  });
});

describe("seedFromDate / dailyDateStr", () => {
  it("produces a stable seed per date", () => {
    expect(seedFromDate("2026-06-06")).toBe(seedFromDate("2026-06-06"));
    expect(seedFromDate("2026-06-06")).not.toBe(seedFromDate("2026-06-07"));
  });
  it("formats a date as YYYY-MM-DD", () => {
    expect(dailyDateStr(new Date(2026, 5, 6))).toBe("2026-06-06");
  });
});

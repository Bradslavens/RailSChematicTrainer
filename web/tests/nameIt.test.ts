import { describe, it, expect } from "vitest";
import { buildChoices } from "../src/games/nameIt.js";

describe("buildChoices", () => {
  const candidates = ["E18LA", "E1221", "E1147", "E1136", "E1194"];

  it("always includes the target", () => {
    expect(buildChoices("E1221", candidates, 4)).toContain("E1221");
  });

  it("returns the requested number of distinct choices", () => {
    const choices = buildChoices("E1221", candidates, 4);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
  });

  it("never duplicates the target among distractors", () => {
    const choices = buildChoices("E1221", candidates, 4);
    expect(choices.filter((c) => c === "E1221")).toHaveLength(1);
  });

  it("falls back to fewer choices when candidates are scarce", () => {
    const choices = buildChoices("A", ["A", "B"], 4);
    expect(choices.sort()).toEqual(["A", "B"]);
  });
});

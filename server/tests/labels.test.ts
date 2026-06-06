import { describe, it, expect } from "vitest";
import {
  isSignalLabel,
  isMilepostLabel,
  normalizeLabel,
  labelsMatch,
} from "../src/domain/labels.js";

describe("isSignalLabel", () => {
  it.each(["E18LA", "E1236", "M571", "O22RB", "E7B", "E13A"])(
    "accepts real signal label %s",
    (label) => {
      expect(isSignalLabel(label)).toBe(true);
    },
  );

  it.each(["La Mesa Blvd", "University Ave", "13", "", "SS", "Grossmont"])(
    "rejects non-signal %s",
    (label) => {
      expect(isSignalLabel(label)).toBe(false);
    },
  );

  it("trims surrounding whitespace before testing", () => {
    expect(isSignalLabel("  E1236 ")).toBe(true);
  });
});

describe("isMilepostLabel", () => {
  it.each(["5", "11", "13", "125"])("accepts %s", (l) => {
    expect(isMilepostLabel(l)).toBe(true);
  });
  it.each(["E18LA", "La Mesa", ""])("rejects %s", (l) => {
    expect(isMilepostLabel(l)).toBe(false);
  });
});

describe("normalizeLabel / labelsMatch", () => {
  it("collapses whitespace and uppercases", () => {
    expect(normalizeLabel("  la   mesa  blvd ")).toBe("LA MESA BLVD");
  });

  it("matches case- and space-insensitively", () => {
    expect(labelsMatch("la mesa blvd", "La Mesa Blvd")).toBe(true);
    expect(labelsMatch("e18la", "E18LA")).toBe(true);
  });

  it("does not match different labels", () => {
    expect(labelsMatch("E18LA", "E18LB")).toBe(false);
  });
});

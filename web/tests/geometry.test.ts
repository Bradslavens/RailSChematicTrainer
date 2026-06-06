import { describe, it, expect } from "vitest";
import { polylineToPath, shieldPoints, diamondPoints, distance } from "../src/schematic/geometry.js";

describe("polylineToPath", () => {
  it("returns empty string for no points", () => {
    expect(polylineToPath([])).toBe("");
  });
  it("starts with M then L for each subsequent point", () => {
    expect(polylineToPath([[0, 0], [10, 20], [30, 40]])).toBe("M 0 0 L 10 20 L 30 40");
  });
});

describe("shieldPoints / diamondPoints", () => {
  it("shield has 5 vertices", () => {
    expect(shieldPoints(0, 0, 10).split(" ")).toHaveLength(5);
  });
  it("diamond has 4 vertices around the center", () => {
    expect(diamondPoints(0, 0, 5)).toBe("0,-5 5,0 0,5 -5,0");
  });
});

describe("distance", () => {
  it("computes euclidean distance", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distance(1, 1, 1, 1)).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import {
  polylineToPath,
  shieldPoints,
  diamondPoints,
  distance,
  arcLengthAt,
  orderAlongTrack,
} from "../src/schematic/geometry.js";

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

describe("arcLengthAt / orderAlongTrack", () => {
  const vertical: [number, number][] = [[0, 0], [0, 100]];

  it("measures distance along a vertical line", () => {
    expect(arcLengthAt(vertical, { x: 5, y: 10 })).toBeCloseTo(10);
    expect(arcLengthAt(vertical, { x: -3, y: 90 })).toBeCloseTo(90);
  });

  it("orders points start-to-end along the track", () => {
    const pts = [
      { id: "c", x: 2, y: 90 },
      { id: "a", x: 1, y: 10 },
      { id: "b", x: 3, y: 50 },
    ];
    expect(orderAlongTrack(pts, vertical).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

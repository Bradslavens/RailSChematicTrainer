import { describe, it, expect } from "vitest";
import { validateSchematicJson, SchematicValidationError } from "../src/domain/schematic.js";

const valid = {
  name: "Test Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", color: "#1f6feb", polyline: [[365, 40], [365, 910]] }],
  points: [
    { type: "signal", label: "E18LA", x: 345, y: 95, track: "left" },
    { type: "station", label: "La Mesa Blvd", x: 430, y: 255 },
    { type: "crossing", label: "University Ave", x: 200, y: 173 },
    { type: "milepost", label: "13", x: 590, y: 145 },
  ],
};

describe("validateSchematicJson", () => {
  it("accepts a valid schematic", () => {
    const out = validateSchematicJson(valid);
    expect(out.name).toBe("Test Branch");
    expect(out.points).toHaveLength(4);
  });

  it("defaults tracks and points to empty arrays", () => {
    const out = validateSchematicJson({ name: "x", viewBox: [0, 0, 1, 1] });
    expect(out.tracks).toEqual([]);
    expect(out.points).toEqual([]);
  });

  it("rejects a missing name", () => {
    expect(() => validateSchematicJson({ ...valid, name: "" })).toThrow(SchematicValidationError);
  });

  it("rejects a viewBox without 4 numbers", () => {
    expect(() => validateSchematicJson({ ...valid, viewBox: [0, 0, 700] })).toThrow();
  });

  it("rejects an unknown point type", () => {
    expect(() =>
      validateSchematicJson({ ...valid, points: [{ type: "bogus", label: "x", x: 1, y: 1 }] }),
    ).toThrow();
  });

  it("rejects a point with an empty label", () => {
    expect(() =>
      validateSchematicJson({ ...valid, points: [{ type: "signal", label: "", x: 1, y: 1 }] }),
    ).toThrow(/label is required/);
  });

  it("rejects a point referencing a nonexistent track", () => {
    expect(() =>
      validateSchematicJson({
        ...valid,
        points: [{ type: "signal", label: "E1", x: 1, y: 1, track: "ghost" }],
      }),
    ).toThrow(/unknown track/);
  });

  it("rejects duplicate track ids", () => {
    expect(() =>
      validateSchematicJson({
        ...valid,
        tracks: [
          { id: "dup", polyline: [[0, 0], [1, 1]] },
          { id: "dup", polyline: [[0, 0], [1, 1]] },
        ],
      }),
    ).toThrow(/duplicate track/);
  });

  it("rejects a track with fewer than 2 polyline points", () => {
    expect(() =>
      validateSchematicJson({ ...valid, tracks: [{ id: "t", polyline: [[0, 0]] }] }),
    ).toThrow();
  });
});

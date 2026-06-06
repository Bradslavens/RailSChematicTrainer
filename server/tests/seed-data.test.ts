import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSchematicJson } from "../src/domain/schematic.js";

const seedDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "seed");
const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));

describe("bundled seed schematics", () => {
  it("has at least one seed file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid schematic JSON", (file) => {
    const json = JSON.parse(readFileSync(path.join(seedDir, file), "utf8"));
    expect(() => validateSchematicJson(json)).not.toThrow();
  });

  it("la-mesa-branch.json has the expected marker mix", () => {
    const json = JSON.parse(readFileSync(path.join(seedDir, "la-mesa-branch.json"), "utf8"));
    const data = validateSchematicJson(json);
    const byType = (t: string) => data.points.filter((p) => p.type === t).length;
    expect(byType("signal")).toBe(20);
    expect(byType("station")).toBe(3);
    expect(byType("crossing")).toBe(9);
    expect(byType("milepost")).toBe(3);
  });
});

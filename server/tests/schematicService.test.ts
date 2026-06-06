import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import {
  createSchematicFromJson,
  listSchematics,
  getSchematic,
  updateSchematic,
  deleteSchematic,
  createPoint,
  updatePoint,
  deletePoint,
  NotFoundError,
} from "../src/services/schematicService.js";
import { SchematicValidationError } from "../src/domain/schematic.js";

const sample = {
  name: "La Mesa Branch",
  viewBox: [0, 0, 700, 950],
  lineColor: "#1f6feb",
  tracks: [{ id: "left", color: "#1f6feb", polyline: [[365, 40], [365, 910]] }],
  points: [
    { type: "signal", label: "E18LA", x: 345, y: 95, track: "left", order: 1 },
    { type: "station", label: "La Mesa Blvd", x: 430, y: 255 },
  ],
};

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("createSchematicFromJson", () => {
  it("persists the schematic, tracks, and points and returns serialized data", async () => {
    const s = await createSchematicFromJson(sample);
    expect(s.name).toBe("La Mesa Branch");
    expect(s.viewBox).toEqual([0, 0, 700, 950]);
    expect(s.tracks).toHaveLength(1);
    expect(s.tracks[0]).toMatchObject({ id: "left", polyline: [[365, 40], [365, 910]] });
    expect(s.points).toHaveLength(2);
    const signal = s.points.find((p) => p.type === "signal")!;
    expect(signal).toMatchObject({ label: "E18LA", track: "left", order: 1 });
  });

  it("rejects invalid JSON without writing anything", async () => {
    await expect(createSchematicFromJson({ name: "" })).rejects.toBeInstanceOf(
      SchematicValidationError,
    );
    expect(await prisma.schematic.count()).toBe(0);
  });
});

describe("listSchematics / getSchematic", () => {
  it("lists with a point count and fetches the full record", async () => {
    const created = await createSchematicFromJson(sample);
    const list = await listSchematics();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "La Mesa Branch", pointCount: 2 });

    const full = await getSchematic(created.id);
    expect(full.points).toHaveLength(2);
  });

  it("throws NotFoundError for a missing id", async () => {
    await expect(getSchematic("nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("updateSchematic / deleteSchematic", () => {
  it("updates metadata", async () => {
    const created = await createSchematicFromJson(sample);
    const updated = await updateSchematic(created.id, { name: "Renamed", status: "published" });
    expect(updated.name).toBe("Renamed");
    expect(updated.status).toBe("published");
  });

  it("deletes the schematic and cascades to points/tracks", async () => {
    const created = await createSchematicFromJson(sample);
    await deleteSchematic(created.id);
    expect(await prisma.schematic.count()).toBe(0);
    expect(await prisma.point.count()).toBe(0);
    expect(await prisma.track.count()).toBe(0);
  });
});

describe("point CRUD", () => {
  it("creates a point on a schematic", async () => {
    const created = await createSchematicFromJson(sample);
    const p = await createPoint(created.id, {
      type: "crossing",
      label: "University Ave",
      x: 200,
      y: 173,
    });
    expect(p).toMatchObject({ type: "crossing", label: "University Ave", track: null });
    expect((await getSchematic(created.id)).points).toHaveLength(3);
  });

  it("rejects a point on an unknown track", async () => {
    const created = await createSchematicFromJson(sample);
    await expect(
      createPoint(created.id, { type: "signal", label: "X", x: 1, y: 1, track: "ghost" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates a point's label and position", async () => {
    const created = await createSchematicFromJson(sample);
    const target = created.points[0];
    const updated = await updatePoint(target.id, { label: "E18LB", x: 999 });
    expect(updated.label).toBe("E18LB");
    expect(updated.x).toBe(999);
  });

  it("deletes a point", async () => {
    const created = await createSchematicFromJson(sample);
    await deletePoint(created.points[0].id);
    expect((await getSchematic(created.id)).points).toHaveLength(1);
  });
});

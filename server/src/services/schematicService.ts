import type { Point, Prisma, Schematic, Track } from "@prisma/client";
import { prisma } from "../db.js";
import {
  validateSchematicJson,
  type PointType,
  type SchematicJson,
} from "../domain/schematic.js";

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

type SchematicWithRelations = Schematic & { tracks: Track[]; points: Point[] };

export interface SerializedPoint {
  id: string;
  type: PointType;
  label: string;
  x: number;
  y: number;
  track: string | null; // track localId
  order: number | null;
}

export interface SerializedSchematic {
  id: string;
  name: string;
  lineColor: string;
  status: string;
  viewBox: [number, number, number, number];
  tracks: { id: string; color: string; polyline: [number, number][] }[];
  points: SerializedPoint[];
}

export function serializeSchematic(s: SchematicWithRelations): SerializedSchematic {
  const localIdByDbId = new Map(s.tracks.map((t) => [t.id, t.localId]));
  return {
    id: s.id,
    name: s.name,
    lineColor: s.lineColor,
    status: s.status,
    viewBox: JSON.parse(s.viewBox),
    tracks: s.tracks.map((t) => ({
      id: t.localId,
      color: t.color,
      polyline: JSON.parse(t.polyline),
    })),
    points: s.points.map((p) => ({
      id: p.id,
      type: p.type as PointType,
      label: p.label,
      x: p.x,
      y: p.y,
      track: p.trackId ? (localIdByDbId.get(p.trackId) ?? null) : null,
      order: p.orderIndex,
    })),
  };
}

const withRelations = { include: { tracks: true, points: true } } as const;

/** Validate JSON and persist a new schematic with its tracks and points. */
export async function createSchematicFromJson(input: unknown): Promise<SerializedSchematic> {
  const data: SchematicJson = validateSchematicJson(input);

  const created = await prisma.$transaction(async (tx) => {
    const schematic = await tx.schematic.create({
      data: {
        name: data.name,
        lineColor: data.lineColor ?? "#1f6feb",
        viewBox: JSON.stringify(data.viewBox),
      },
    });

    const trackIdMap = new Map<string, string>();
    for (const t of data.tracks) {
      const track = await tx.track.create({
        data: {
          schematicId: schematic.id,
          localId: t.id,
          color: t.color ?? data.lineColor ?? "#1f6feb",
          polyline: JSON.stringify(t.polyline),
        },
      });
      trackIdMap.set(t.id, track.id);
    }

    for (const p of data.points) {
      await tx.point.create({
        data: {
          schematicId: schematic.id,
          type: p.type,
          label: p.label,
          x: p.x,
          y: p.y,
          orderIndex: p.order ?? null,
          trackId: p.track ? (trackIdMap.get(p.track) ?? null) : null,
        },
      });
    }

    return tx.schematic.findUniqueOrThrow({ where: { id: schematic.id }, ...withRelations });
  });

  return serializeSchematic(created);
}

export async function listSchematics(): Promise<
  { id: string; name: string; status: string; pointCount: number }[]
> {
  const rows = await prisma.schematic.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { points: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    pointCount: r._count.points,
  }));
}

export async function getSchematic(id: string): Promise<SerializedSchematic> {
  const s = await prisma.schematic.findUnique({ where: { id }, ...withRelations });
  if (!s) throw new NotFoundError("Schematic not found");
  return serializeSchematic(s);
}

export async function updateSchematic(
  id: string,
  data: { name?: string; status?: string; lineColor?: string },
): Promise<SerializedSchematic> {
  await assertSchematicExists(id);
  const s = await prisma.schematic.update({ where: { id }, data, ...withRelations });
  return serializeSchematic(s);
}

export async function deleteSchematic(id: string): Promise<void> {
  await assertSchematicExists(id);
  await prisma.schematic.delete({ where: { id } });
}

export interface PointInput {
  type: PointType;
  label: string;
  x: number;
  y: number;
  track?: string | null;
  order?: number | null;
}

async function resolveTrackId(
  schematicId: string,
  localId: string | null | undefined,
): Promise<string | null> {
  if (!localId) return null;
  const track = await prisma.track.findFirst({ where: { schematicId, localId } });
  if (!track) throw new NotFoundError(`Track "${localId}" not found on this schematic`);
  return track.id;
}

export async function createPoint(schematicId: string, input: PointInput): Promise<SerializedPoint> {
  await assertSchematicExists(schematicId);
  const trackId = await resolveTrackId(schematicId, input.track);
  const p = await prisma.point.create({
    data: {
      schematicId,
      type: input.type,
      label: input.label,
      x: input.x,
      y: input.y,
      orderIndex: input.order ?? null,
      trackId,
    },
    include: { track: true },
  });
  return {
    id: p.id,
    type: p.type as PointType,
    label: p.label,
    x: p.x,
    y: p.y,
    track: p.track?.localId ?? null,
    order: p.orderIndex,
  };
}

export async function updatePoint(
  id: string,
  input: Partial<PointInput>,
): Promise<SerializedPoint> {
  const existing = await prisma.point.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Point not found");

  const data: Prisma.PointUpdateInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.label !== undefined) data.label = input.label;
  if (input.x !== undefined) data.x = input.x;
  if (input.y !== undefined) data.y = input.y;
  if (input.order !== undefined) data.orderIndex = input.order;
  if (input.track !== undefined) {
    const trackId = await resolveTrackId(existing.schematicId, input.track);
    data.track = trackId ? { connect: { id: trackId } } : { disconnect: true };
  }

  const p = await prisma.point.update({ where: { id }, data, include: { track: true } });
  return {
    id: p.id,
    type: p.type as PointType,
    label: p.label,
    x: p.x,
    y: p.y,
    track: p.track?.localId ?? null,
    order: p.orderIndex,
  };
}

export async function deletePoint(id: string): Promise<void> {
  const existing = await prisma.point.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Point not found");
  await prisma.point.delete({ where: { id } });
}

async function assertSchematicExists(id: string): Promise<void> {
  const found = await prisma.schematic.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw new NotFoundError("Schematic not found");
}

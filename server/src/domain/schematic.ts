import { z } from "zod";

/** Marker categories that can appear on a schematic. */
export const pointTypeSchema = z.enum(["signal", "station", "crossing", "milepost", "ss"]);
export type PointType = z.infer<typeof pointTypeSchema>;

const coordPair = z.tuple([z.number(), z.number()]);

const trackSchema = z.object({
  id: z.string().min(1, "track id is required"),
  color: z.string().optional(),
  polyline: z.array(coordPair).min(2, "a track needs at least 2 points"),
});

const pointSchema = z.object({
  type: pointTypeSchema,
  label: z.string().min(1, "label is required"),
  x: z.number(),
  y: z.number(),
  track: z.string().optional(),
  order: z.number().int().optional(),
});

/** Full schema for a schematic JSON file. */
export const schematicJsonSchema = z
  .object({
    name: z.string().min(1, "name is required"),
    viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    lineColor: z.string().optional(),
    tracks: z.array(trackSchema).default([]),
    points: z.array(pointSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // Track ids must be unique.
    const seen = new Set<string>();
    data.tracks.forEach((t, i) => {
      if (seen.has(t.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate track id "${t.id}"`,
          path: ["tracks", i, "id"],
        });
      }
      seen.add(t.id);
    });
    // A point's track reference must point at a real track.
    data.points.forEach((p, i) => {
      if (p.track && !seen.has(p.track)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `point "${p.label}" references unknown track "${p.track}"`,
          path: ["points", i, "track"],
        });
      }
    });
  });

export type SchematicJson = z.infer<typeof schematicJsonSchema>;

export class SchematicValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchematicValidationError";
  }
}

/** Validate unknown input as a schematic JSON, throwing a clear error on failure. */
export function validateSchematicJson(input: unknown): SchematicJson {
  const result = schematicJsonSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path?.length ? ` (at ${issue.path.join(".")})` : "";
    throw new SchematicValidationError(`${issue?.message ?? "Invalid schematic"}${where}`);
  }
  return result.data;
}

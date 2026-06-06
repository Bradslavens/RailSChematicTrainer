import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { SchematicValidationError } from "../domain/schematic.js";
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
} from "../services/schematicService.js";

const pointInputSchema = z.object({
  type: z.enum(["signal", "station", "crossing", "milepost", "ss"]),
  label: z.string().min(1),
  x: z.number(),
  y: z.number(),
  track: z.string().nullable().optional(),
  order: z.number().int().nullable().optional(),
});

const schematicMetaSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
  lineColor: z.string().optional(),
});

export const schematicsRouter = Router();

// ---- read (any authenticated user) ----
schematicsRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json({ schematics: await listSchematics() });
  } catch (err) {
    next(err);
  }
});

schematicsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    res.json({ schematic: await getSchematic(req.params.id) });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ---- write (admin only) ----
schematicsRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const schematic = await createSchematicFromJson(req.body);
    res.status(201).json({ schematic });
  } catch (err) {
    if (err instanceof SchematicValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

schematicsRouter.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const parsed = schematicMetaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  try {
    res.json({ schematic: await updateSchematic(req.params.id, parsed.data) });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

schematicsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await deleteSchematic(req.params.id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ---- points (admin only) ----
schematicsRouter.post("/:id/points", requireAuth, requireAdmin, async (req, res, next) => {
  const parsed = pointInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  try {
    const point = await createPoint(req.params.id, parsed.data);
    res.status(201).json({ point });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

export const pointsRouter = Router();

pointsRouter.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const parsed = pointInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  try {
    res.json({ point: await updatePoint(req.params.id, parsed.data) });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

pointsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await deletePoint(req.params.id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

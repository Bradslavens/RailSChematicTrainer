import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getMyStats, getLeaderboard, getMastery, getDuePoints } from "../services/statsService.js";

const typesSchema = z
  .string()
  .optional()
  .transform((s) => (s ? (s.split(",") as ("signal" | "station" | "crossing" | "milepost" | "ss")[]) : undefined));

export const statsRouter = Router();

statsRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json({ stats: await getMyStats(req.user!.userId) });
  } catch (err) {
    next(err);
  }
});

statsRouter.get("/leaderboard", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ leaderboard: await getLeaderboard(limit) });
  } catch (err) {
    next(err);
  }
});

statsRouter.get("/mastery", requireAuth, async (req: AuthedRequest, res, next) => {
  const schematicId = String(req.query.schematicId ?? "");
  if (!schematicId) return res.status(400).json({ error: "schematicId is required" });
  try {
    res.json({ mastery: await getMastery(req.user!.userId, schematicId) });
  } catch (err) {
    next(err);
  }
});

export const progressRouter = Router();

progressRouter.get("/due", requireAuth, async (req: AuthedRequest, res, next) => {
  const schematicId = String(req.query.schematicId ?? "");
  if (!schematicId) return res.status(400).json({ error: "schematicId is required" });
  const types = typesSchema.parse(req.query.types);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  try {
    const pointIds = await getDuePoints(req.user!.userId, schematicId, { types, limit });
    res.json({ pointIds });
  } catch (err) {
    next(err);
  }
});

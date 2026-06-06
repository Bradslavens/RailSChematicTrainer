import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { recordAttempt, attemptSummary, type GameMode } from "../services/attemptService.js";
import { NotFoundError } from "../services/schematicService.js";

const gameModeSchema = z.enum(["pin-drop", "name-it", "flashcard", "run-the-line"]);

const attemptSchema = z.object({
  pointId: z.string().min(1),
  gameMode: gameModeSchema,
  correct: z.boolean(),
  responseMs: z.number().int().nonnegative().nullable().optional(),
});

export const attemptsRouter = Router();

attemptsRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  try {
    const attempt = await recordAttempt(req.user!.userId, parsed.data);
    res.status(201).json({ attempt: { id: attempt.id } });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

attemptsRouter.get("/summary", requireAuth, async (req: AuthedRequest, res, next) => {
  const mode = req.query.gameMode;
  const parsedMode = mode ? gameModeSchema.safeParse(mode) : null;
  if (parsedMode && !parsedMode.success) {
    return res.status(400).json({ error: "Invalid gameMode" });
  }
  try {
    const summary = await attemptSummary(
      req.user!.userId,
      parsedMode ? (parsedMode.data as GameMode) : undefined,
    );
    res.json({ summary });
  } catch (err) {
    next(err);
  }
});

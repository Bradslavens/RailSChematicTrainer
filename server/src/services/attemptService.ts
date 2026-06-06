import type { Attempt } from "@prisma/client";
import { prisma } from "../db.js";
import { NotFoundError } from "./schematicService.js";

export type GameMode = "pin-drop" | "name-it" | "flashcard" | "run-the-line";

export interface AttemptInput {
  pointId: string;
  gameMode: GameMode;
  correct: boolean;
  responseMs?: number | null;
}

/** Record a single answer attempt for a user. */
export async function recordAttempt(userId: string, input: AttemptInput): Promise<Attempt> {
  const point = await prisma.point.findUnique({ where: { id: input.pointId } });
  if (!point) throw new NotFoundError("Point not found");
  return prisma.attempt.create({
    data: {
      userId,
      pointId: input.pointId,
      gameMode: input.gameMode,
      correct: input.correct,
      responseMs: input.responseMs ?? null,
    },
  });
}

/** Per-user accuracy summary, optionally for one game mode. */
export async function attemptSummary(
  userId: string,
  gameMode?: GameMode,
): Promise<{ total: number; correct: number; accuracy: number }> {
  const where = { userId, ...(gameMode ? { gameMode } : {}) };
  const total = await prisma.attempt.count({ where });
  const correct = await prisma.attempt.count({ where: { ...where, correct: true } });
  return { total, correct, accuracy: total === 0 ? 0 : correct / total };
}

import type { Attempt, UserStats } from "@prisma/client";
import { prisma } from "../db.js";
import { recordAttempt, type AttemptInput } from "./attemptService.js";
import { levelForXp, xpForResult, levelProgress, nextStreak, dayStr } from "../domain/stats.js";
import { nextReview } from "../domain/srs.js";
import type { PointType } from "../domain/schematic.js";

export interface PublicStats {
  xp: number;
  level: number;
  intoLevel: number;
  perLevel: number;
  currentStreak: number;
  longestStreak: number;
}

export function publicStats(s: UserStats): PublicStats {
  const { level, intoLevel, perLevel } = levelProgress(s.xp);
  return {
    xp: s.xp,
    level,
    intoLevel,
    perLevel,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
  };
}

async function ensureStats(userId: string): Promise<UserStats> {
  return prisma.userStats.upsert({ where: { userId }, create: { userId }, update: {} });
}

export interface AttemptOutcome {
  attempt: Attempt;
  stats: PublicStats;
  leveledUp: boolean;
}

/** Record an attempt and apply its effects: SRS progress, XP, and daily streak. */
export async function applyAttemptOutcome(
  userId: string,
  input: AttemptInput,
  nowMs: number = Date.now(),
): Promise<AttemptOutcome> {
  const attempt = await recordAttempt(userId, input); // validates the point exists

  const existing = await prisma.progress.findUnique({
    where: { userId_pointId: { userId, pointId: input.pointId } },
  });
  const srs = nextReview(
    { box: existing?.srsBox ?? 0, streak: existing?.streak ?? 0 },
    input.correct,
    nowMs,
  );
  await prisma.progress.upsert({
    where: { userId_pointId: { userId, pointId: input.pointId } },
    create: {
      userId,
      pointId: input.pointId,
      srsBox: srs.box,
      dueAt: new Date(srs.dueAt),
      streak: srs.streak,
      mastery: srs.mastery,
    },
    update: { srsBox: srs.box, dueAt: new Date(srs.dueAt), streak: srs.streak, mastery: srs.mastery },
  });

  const before = await ensureStats(userId);
  const xp = before.xp + xpForResult(input.correct);
  const streak = nextStreak(
    {
      lastStudyDay: before.lastStudyDay,
      currentStreak: before.currentStreak,
      longestStreak: before.longestStreak,
    },
    dayStr(nowMs),
  );
  const level = levelForXp(xp);
  const after = await prisma.userStats.update({
    where: { userId },
    data: {
      xp,
      level,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDay: streak.lastStudyDay,
    },
  });

  return { attempt, stats: publicStats(after), leveledUp: level > before.level };
}

export async function getMyStats(userId: string): Promise<PublicStats> {
  return publicStats(await ensureStats(userId));
}

export async function getLeaderboard(
  limit = 10,
): Promise<{ email: string; xp: number; level: number }[]> {
  const rows = await prisma.userStats.findMany({
    orderBy: { xp: "desc" },
    take: limit,
    include: { user: { select: { email: true } } },
  });
  return rows.map((r) => ({ email: r.user.email, xp: r.xp, level: r.level }));
}

export interface MasteryRow {
  type: PointType;
  total: number;
  mastered: number;
  avgMastery: number;
}

/** Per-category mastery for a user on one schematic. */
export async function getMastery(userId: string, schematicId: string): Promise<MasteryRow[]> {
  const points = await prisma.point.findMany({ where: { schematicId } });
  const progress = await prisma.progress.findMany({
    where: { userId, pointId: { in: points.map((p) => p.id) } },
  });
  const masteryByPoint = new Map(progress.map((p) => [p.pointId, p.mastery]));

  const types: PointType[] = ["signal", "station", "crossing", "milepost", "ss"];
  return types
    .map((type) => {
      const ofType = points.filter((p) => p.type === type);
      if (ofType.length === 0) return null;
      const masteries = ofType.map((p) => masteryByPoint.get(p.id) ?? 0);
      const mastered = masteries.filter((m) => m >= 0.8).length;
      const avg = masteries.reduce((a, b) => a + b, 0) / ofType.length;
      return { type, total: ofType.length, mastered, avgMastery: avg };
    })
    .filter((r): r is MasteryRow => r !== null);
}

/** Point ids that are due for review (unseen or past due), overdue first then new. */
export async function getDuePoints(
  userId: string,
  schematicId: string,
  opts: { types?: PointType[]; limit?: number; nowMs?: number } = {},
): Promise<string[]> {
  const now = opts.nowMs ?? Date.now();
  const points = await prisma.point.findMany({
    where: { schematicId, ...(opts.types ? { type: { in: opts.types } } : {}) },
  });
  const progress = await prisma.progress.findMany({
    where: { userId, pointId: { in: points.map((p) => p.id) } },
  });
  const byPoint = new Map(progress.map((p) => [p.pointId, p]));

  const due = points
    .map((p) => ({ id: p.id, prog: byPoint.get(p.id) }))
    .filter((p) => !p.prog || p.prog.dueAt.getTime() <= now)
    .sort((a, b) => {
      const ad = a.prog ? a.prog.dueAt.getTime() : Infinity; // new cards after overdue ones
      const bd = b.prog ? b.prog.dueAt.getTime() : Infinity;
      return ad - bd;
    });

  const limited = opts.limit ? due.slice(0, opts.limit) : due;
  return limited.map((p) => p.id);
}

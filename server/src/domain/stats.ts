// Pure XP / level / streak math. Dependency-free and unit-tested.

export const XP_PER_LEVEL = 100;

/** Level for a given total XP. Level 1 covers 0..99 XP, level 2 is 100..199, etc. */
export function levelForXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

/** XP earned for one attempt. Correct answers earn more; trying still earns a little. */
export function xpForResult(correct: boolean): number {
  return correct ? 10 : 1;
}

/** Progress within the current level, for a progress bar. */
export function levelProgress(xp: number): { level: number; intoLevel: number; perLevel: number } {
  const level = levelForXp(xp);
  return { level, intoLevel: xp - (level - 1) * XP_PER_LEVEL, perLevel: XP_PER_LEVEL };
}

export interface StreakState {
  lastStudyDay: string | null; // YYYY-MM-DD (UTC)
  currentStreak: number;
  longestStreak: number;
}

/** A YYYY-MM-DD (UTC) day string for a timestamp. */
export function dayStr(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function addDays(day: string, delta: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Advance a daily streak given activity "today". Same-day activity is a no-op. */
export function nextStreak(prev: StreakState, today: string): StreakState {
  if (prev.lastStudyDay === today) return prev;
  const continued = prev.lastStudyDay === addDays(today, -1);
  const currentStreak = continued ? prev.currentStreak + 1 : 1;
  return {
    lastStudyDay: today,
    currentStreak,
    longestStreak: Math.max(prev.longestStreak, currentStreak),
  };
}

// Pure spaced-repetition (Leitner) scheduling. Unit-tested.

export const MAX_BOX = 5;
const DAY_MS = 86_400_000;
/** Review interval in days for each box (box 0 is reviewed again immediately/soon). */
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];

export interface SrsState {
  box: number;
  dueAt: number; // epoch ms
  streak: number;
  mastery: number; // 0..1
}

/** Compute the next review state after answering a card. */
export function nextReview(
  prev: { box: number; streak: number },
  correct: boolean,
  nowMs: number,
): SrsState {
  const box = correct ? Math.min(prev.box + 1, MAX_BOX) : 0;
  const streak = correct ? prev.streak + 1 : 0;
  const dueAt = nowMs + BOX_INTERVAL_DAYS[box] * DAY_MS;
  return { box, dueAt, streak, mastery: box / MAX_BOX };
}

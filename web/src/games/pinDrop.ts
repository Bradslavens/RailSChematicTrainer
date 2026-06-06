import { distance } from "../schematic/geometry.js";

export type PinDropGradeLevel = "perfect" | "close" | "miss";

export interface PinDropGrade {
  /** True only when the learner picked the right spot (perfect). */
  correct: boolean;
  level: PinDropGradeLevel;
  points: number;
  distance: number;
}

export interface GradeOptions {
  /** Within this distance (viewBox units) counts as a perfect hit. */
  perfectWithin?: number;
  /** Within this distance counts as "close" (partial credit). */
  closeWithin?: number;
}

const DEFAULTS = { perfectWithin: 25, closeWithin: 80 };

/** Grade a tap against the target point's coordinates. */
export function gradeTap(
  chosen: { x: number; y: number },
  target: { x: number; y: number },
  opts: GradeOptions = {},
): PinDropGrade {
  const perfectWithin = opts.perfectWithin ?? DEFAULTS.perfectWithin;
  const closeWithin = opts.closeWithin ?? DEFAULTS.closeWithin;
  const d = distance(chosen.x, chosen.y, target.x, target.y);

  if (d <= perfectWithin) return { correct: true, level: "perfect", points: 100, distance: d };
  if (d <= closeWithin) return { correct: false, level: "close", points: 40, distance: d };
  return { correct: false, level: "miss", points: 0, distance: d };
}

/** Pick up to `count` distinct items in random order. Injectable rng for tests. */
export function buildQuestions<T>(items: T[], count: number, rng: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

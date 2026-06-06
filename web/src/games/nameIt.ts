function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a multiple-choice set for "Name It": the correct label plus up to
 * `count - 1` distractors, all shuffled.
 */
export function buildChoices(
  targetLabel: string,
  candidates: string[],
  count: number,
  rng: () => number = Math.random,
): string[] {
  const distractors = shuffle(
    candidates.filter((l) => l !== targetLabel),
    rng,
  ).slice(0, Math.max(0, count - 1));
  return shuffle([targetLabel, ...distractors], rng);
}

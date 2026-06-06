/** Today's date as YYYY-MM-DD (local). The daily challenge is keyed on this. */
export function dailyDateStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Deterministic seed from a date string. */
export function seedFromDate(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically pick `count` items for a given date (same date -> same set). */
export function pickDaily<T>(items: T[], count: number, date: string): T[] {
  const rng = seededRng(seedFromDate(date));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}

export const dailyDoneKey = (date: string): string => `rst.daily.${date}`;

export function isDailyDone(date: string = dailyDateStr()): boolean {
  return localStorage.getItem(dailyDoneKey(date)) === "1";
}

export function markDailyDone(date: string = dailyDateStr()): void {
  localStorage.setItem(dailyDoneKey(date), "1");
}

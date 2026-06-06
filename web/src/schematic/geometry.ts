// Pure geometry helpers for rendering schematics. Dependency-free and unit-tested.

/** Convert an ordered list of [x, y] points into an SVG path "d" string. */
export function polylineToPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

/** Points for a downward "shield" pentagon (milepost marker), centered on origin. */
export function shieldPoints(cx: number, cy: number, r: number): string {
  const pts: [number, number][] = [
    [cx - r, cy - r],
    [cx + r, cy - r],
    [cx + r, cy + r * 0.25],
    [cx, cy + r],
    [cx - r, cy + r * 0.25],
  ];
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Points for a diamond, centered on origin (crossing marker). */
export function diamondPoints(cx: number, cy: number, r: number): string {
  const pts: [number, number][] = [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ];
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Euclidean distance between two points. */
export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

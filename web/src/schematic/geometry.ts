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

/** Distance along a polyline to the projection of the closest point on it. */
export function arcLengthAt(polyline: [number, number][], p: { x: number; y: number }): number {
  let best = Infinity;
  let bestLen = 0;
  let acc = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const [ax, ay] = polyline[i];
    const [bx, by] = polyline[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const segLen = Math.hypot(dx, dy);
    const t = segLen === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / (segLen * segLen)));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const d = Math.hypot(p.x - projX, p.y - projY);
    if (d < best) {
      best = d;
      bestLen = acc + t * segLen;
    }
    acc += segLen;
  }
  return bestLen;
}

/** Order points by their position along a track's polyline (start -> end). */
export function orderAlongTrack<T extends { x: number; y: number }>(
  points: T[],
  polyline: [number, number][],
): T[] {
  return [...points].sort((a, b) => arcLengthAt(polyline, a) - arcLengthAt(polyline, b));
}

import type { CadPoint } from "@/features/cad-editor/geometry/textGeometry";

export type TravelCandidate = {
  points: CadPoint[];
  closed: boolean;
};

export type OrientedTravelPath = {
  index: number;
  points: CadPoint[];
  closed: boolean;
};

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeClosed(points: CadPoint[]): CadPoint[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) <= EPS) {
    return points.slice(0, -1).map((p) => ({ x: round(p.x), y: round(p.y) }));
  }
  return points.map((p) => ({ x: round(p.x), y: round(p.y) }));
}

function closeIfNeeded(points: CadPoint[]): CadPoint[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) <= EPS) return [...points];
  return [...points, { ...first }];
}

function rotateClosedPath(points: CadPoint[], startIndex: number): CadPoint[] {
  const open = normalizeClosed(points);
  if (open.length === 0) return [];
  const idx = ((startIndex % open.length) + open.length) % open.length;
  const rotated = [...open.slice(idx), ...open.slice(0, idx)];
  return closeIfNeeded(rotated);
}

function findNearestVertexIndex(points: CadPoint[], target: CadPoint): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i++) {
    const d = distance(points[i], target);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function orientOpenPathFromNearest(points: CadPoint[], current: CadPoint): CadPoint[] {
  if (points.length <= 1) return [...points];

  const start = points[0];
  const end = points[points.length - 1];

  return distance(current, end) < distance(current, start)
    ? [...points].reverse()
    : [...points];
}

export function orientClosedPathFromNearest(points: CadPoint[], current: CadPoint): CadPoint[] {
  const open = normalizeClosed(points);
  if (open.length <= 1) return closeIfNeeded(open);

  const nearestIndex = findNearestVertexIndex(open, current);
  return rotateClosedPath(open, nearestIndex);
}

export function orientPathFromNearest(
  points: CadPoint[],
  current: CadPoint,
  closed: boolean
): CadPoint[] {
  return closed
    ? orientClosedPathFromNearest(points, current)
    : orientOpenPathFromNearest(points, current);
}

export function optimizeTravel(
  contours: TravelCandidate[],
  startPoint: CadPoint = { x: 0, y: 0 }
): OrientedTravelPath[] {
  const pending = contours.map((item, index) => ({ ...item, index }));
  const result: OrientedTravelPath[] = [];
  let current = { ...startPoint };

  while (pending.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestOriented: CadPoint[] = [];

    for (let i = 0; i < pending.length; i++) {
      const candidate = pending[i];
      const oriented = orientPathFromNearest(candidate.points, current, candidate.closed);
      if (oriented.length === 0) continue;

      const d = distance(current, oriented[0]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
        bestOriented = oriented;
      }
    }

    const picked = pending.splice(bestIndex, 1)[0];
    const oriented = bestOriented.length > 0
      ? bestOriented
      : orientPathFromNearest(picked.points, current, picked.closed);

    result.push({
      index: picked.index,
      points: oriented,
      closed: picked.closed,
    });

    if (oriented.length > 0) {
      current = oriented[oriented.length - 1];
    }
  }

  return result;
}

/**
 * Оставляю совместимость со старым API.
 */
export function optimizeTravelOrder(
  contours: CadPoint[][],
  startPoint: CadPoint = { x: 0, y: 0 }
): number[] {
  return optimizeTravel(
    contours.map((points) => ({ points, closed: false })),
    startPoint
  ).map((item) => item.index);
}
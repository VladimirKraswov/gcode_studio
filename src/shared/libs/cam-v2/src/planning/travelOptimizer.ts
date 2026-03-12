// src/planning/travelOptimizer.ts

import type { Point } from "../types";

export type TravelCandidate = {
  points: Point[];
  closed: boolean;
};

export type OrientedTravelPath = {
  index: number;
  points: Point[];
  closed: boolean;
};

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeClosed(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) <= EPS) {
    return points.slice(0, -1).map((p) => ({ x: round(p.x), y: round(p.y) }));
  }
  return points.map((p) => ({ x: round(p.x), y: round(p.y) }));
}

function closeIfNeeded(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) <= EPS) return [...points];
  return [...points, { ...first }];
}

function rotateClosedPath(points: Point[], startIndex: number): Point[] {
  const open = normalizeClosed(points);
  if (open.length === 0) return [];
  const idx = ((startIndex % open.length) + open.length) % open.length;
  const rotated = [...open.slice(idx), ...open.slice(0, idx)];
  return closeIfNeeded(rotated);
}

function findNearestVertexIndex(points: Point[], target: Point): number {
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

export function orientOpenPathFromNearest(points: Point[], current: Point): Point[] {
  if (points.length <= 1) return [...points];
  const start = points[0];
  const end = points[points.length - 1];
  return distance(current, end) < distance(current, start) ? [...points].reverse() : [...points];
}

export function orientClosedPathFromNearest(points: Point[], current: Point): Point[] {
  const open = normalizeClosed(points);
  if (open.length <= 1) return closeIfNeeded(open);
  const nearestIndex = findNearestVertexIndex(open, current);
  return rotateClosedPath(open, nearestIndex);
}

export function orientPathFromNearest(points: Point[], current: Point, closed: boolean): Point[] {
  return closed ? orientClosedPathFromNearest(points, current) : orientOpenPathFromNearest(points, current);
}

export function optimizeTravel(
  contours: TravelCandidate[],
  startPoint: Point = { x: 0, y: 0 }
): OrientedTravelPath[] {
  const pending = contours.map((item, index) => ({ ...item, index }));
  const result: OrientedTravelPath[] = [];
  let current = { ...startPoint };

  while (pending.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestOriented: Point[] = [];

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
    const oriented = bestOriented.length > 0 ? bestOriented : orientPathFromNearest(picked.points, current, picked.closed);

    result.push({ index: picked.index, points: oriented, closed: picked.closed });
    if (oriented.length > 0) current = oriented[oriented.length - 1];
  }

  return result;
}

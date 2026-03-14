// src/planning/travelOptimizer.ts

import type { Point } from "../types";
import { closeLoop, normalizeClosed } from "../geometry/polygon";

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

function normalizePoints(points: Point[]): Point[] {
  return points.map((p) => ({ x: round(p.x), y: round(p.y) }));
}

function normalizeClosedPath(points: Point[]): Point[] {
  return normalizePoints(normalizeClosed(points));
}

function closeIfNeeded(points: Point[]): Point[] {
  const normalized = normalizeClosedPath(points);
  if (normalized.length < 2) return [...normalized];
  return closeLoop(normalized);
}

function rotateClosedPath(points: Point[], startIndex: number): Point[] {
  const open = normalizeClosedPath(points);
  if (open.length === 0) return [];
  const idx = ((startIndex % open.length) + open.length) % open.length;
  const rotated = [...open.slice(idx), ...open.slice(0, idx)];
  return closeIfNeeded(rotated);
}

function reverseClosedPath(points: Point[]): Point[] {
  const open = normalizeClosedPath(points);
  if (open.length === 0) return [];
  return closeIfNeeded([...open].reverse());
}

function rotateClosedPathFromReversed(points: Point[], startIndex: number): Point[] {
  const reversed = normalizeClosed(reverseClosedPath(points));
  if (reversed.length === 0) return [];
  const idx = ((startIndex % reversed.length) + reversed.length) % reversed.length;
  const rotated = [...reversed.slice(idx), ...reversed.slice(0, idx)];
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
  const normalized = normalizePoints(points);
  if (normalized.length <= 1) return [...normalized];
  const start = normalized[0];
  const end = normalized[normalized.length - 1];
  return distance(current, end) < distance(current, start) ? [...normalized].reverse() : [...normalized];
}

export function orientClosedPathFromNearest(points: Point[], current: Point): Point[] {
  const open = normalizeClosedPath(points);
  if (open.length <= 1) return closeIfNeeded(open);

  const nearestIndexForward = findNearestVertexIndex(open, current);
  const forward = rotateClosedPath(open, nearestIndexForward);

  const reversedOpen = [...open].reverse();
  const nearestIndexReverse = findNearestVertexIndex(reversedOpen, current);
  const reverse = rotateClosedPathFromReversed(open, nearestIndexReverse);

  if (forward.length === 0) return reverse;
  if (reverse.length === 0) return forward;

  const dForward = distance(current, forward[0]);
  const dReverse = distance(current, reverse[0]);
  return dReverse < dForward ? reverse : forward;
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
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestOriented: Point[] = [];

    for (let i = 0; i < pending.length; i++) {
      const candidate = pending[i];
      const oriented = orientPathFromNearest(candidate.points, current, candidate.closed);
      if (oriented.length === 0) continue;

      const d = distance(current, oriented[0]);
      if (d < bestDistance - EPS) {
        bestDistance = d;
        bestIndex = i;
        bestOriented = oriented;
      }
    }

    if (bestIndex < 0) break;

    const picked = pending.splice(bestIndex, 1)[0];
    const oriented =
      bestOriented.length > 0
        ? bestOriented
        : orientPathFromNearest(picked.points, current, picked.closed);

    result.push({ index: picked.index, points: oriented, closed: picked.closed });

    if (oriented.length > 0) {
      current = picked.closed ? oriented[0] : oriented[oriented.length - 1];
    }
  }

  return result;
}
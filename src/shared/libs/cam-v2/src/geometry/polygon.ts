// src/geometry/polygon.ts
import type { Point } from "../types";

export const EPS = 1e-6;
export const CLOSE_EPS = 1e-3;

function round(value: number): number {
  return Number(value.toFixed(6));
}

export function roundPoint(p: Point): Point {
  return {
    x: round(p.x),
    y: round(p.y),
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointsEqual(a: Point, b: Point, eps = EPS): boolean {
  return distance(a, b) <= eps;
}

export function dedupeSequential(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const src of points) {
    const p = roundPoint(src);
    if (out.length === 0 || !pointsEqual(out[out.length - 1], p)) {
      out.push(p);
    }
  }
  return out;
}

export function normalizeClosed(points: Point[]): Point[] {
  const clean = dedupeSequential(points);
  if (clean.length < 2) return clean;

  const first = clean[0];
  const last = clean[clean.length - 1];
  if (distance(first, last) <= CLOSE_EPS) {
    return clean.slice(0, -1);
  }

  return clean;
}

export function closeLoop(points: Point[]): Point[] {
  const open = normalizeClosed(points);
  if (open.length < 3) return open;
  return [...open, { ...open[0] }];
}

export function signedArea(points: Point[]): number {
  const open = normalizeClosed(points);
  if (open.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < open.length; i++) {
    const a = open[i];
    const b = open[(i + 1) % open.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

export function ensureCCW(points: Point[]): Point[] {
  const open = normalizeClosed(points);
  return signedArea(open) >= 0 ? open : [...open].reverse();
}

export function ensureCW(points: Point[]): Point[] {
  const open = normalizeClosed(points);
  return signedArea(open) <= 0 ? open : [...open].reverse();
}
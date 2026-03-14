// src/geometry/pocket.ts
import type { Point } from "../types";
import { buildOffset, pointInPolygon as pip } from "./offset";

function round(value: number): number {
  return Number(value.toFixed(4));
}

function normalizeClosed(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  const d = Math.hypot(first.x - last.x, first.y - last.y);
  // Align threshold with geometry engine (0.001mm)
  if (d <= 0.001) return points.slice(0, -1);
  return points;
}

function centroid(points: Point[]): Point {
  const poly = [...points];
  if (poly.length > 0 && Math.hypot(poly[0].x - poly[poly.length-1].x, poly[0].y - poly[poly.length-1].y) > 1e-6) {
    poly.push(poly[0]);
  }
  let cx = 0, cy = 0, area = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i], q = poly[i + 1];
    const f = p.x * q.y - q.x * p.y;
    area += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  if (Math.abs(area) < 1e-10) return points[0] || { x: 0, y: 0 };
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  return pip(point, polygon);
}

export function buildPocketOffsets(
  polyline: Point[],
  toolRadius: number,
  stepover: number,
  keepCenterCleanup = true
): Point[][] {
  const base = normalizeClosed(polyline);
  if (base.length < 3) return [];

  const paths: Point[][] = [];
  let currentOffset = toolRadius;
  const maxSafetyIter = 500;
  let lastLoops: Point[][] = [];

  for (let i = 0; i < maxSafetyIter; i++) {
    // buildOffset uses +offset for OUTWARD.
    // Pocketing needs INWARD, so use -currentOffset.
    const loops = buildOffset(base, -currentOffset, "round", 4);
    if (loops.length === 0) break;
    paths.push(...loops);
    lastLoops = loops;
    currentOffset += stepover;
  }

  if (keepCenterCleanup) {
    const targets = lastLoops.length > 0 ? lastLoops : [base];
    for (const loop of targets) {
      const c = centroid(loop);
      // Use a 0.5mm cleanup square (d=0.25) to ensure center coverage
      const d = 0.25;
      const cleanupPath = [
        { x: round(c.x - d), y: round(c.y - d) },
        { x: round(c.x + d), y: round(c.y - d) },
        { x: round(c.x + d), y: round(c.y + d) },
        { x: round(c.x - d), y: round(c.y + d) },
        { x: round(c.x - d), y: round(c.y - d) },
      ];
      // Only add if ALL points of cleanup path are inside the boundary
      if (cleanupPath.every(p => pointInPolygon(p, base))) {
        paths.push(cleanupPath);
      }
    }
  }

  return paths;
}

export function generateOffsetPocketWithHoles(
  contours: Point[][],
  toolRadius: number,
  step: number
): Point[][] {
  const result: Point[][] = [];
  if (contours.length > 0) {
    result.push(...buildPocketOffsets(contours[0], toolRadius, step));
  }
  return result;
}

export function generateParallelPocketWithHoles(
  contours: Point[][],
  toolRadius: number,
  step: number,
  _angle = 0
): Point[][] {
  return generateOffsetPocketWithHoles(contours, toolRadius, step);
}

export function generateBestPocket(
  contours: Point[][],
  toolRadius: number,
  step: number,
  _angle = 0
): Point[][] {
  return generateOffsetPocketWithHoles(contours, toolRadius, step);
}

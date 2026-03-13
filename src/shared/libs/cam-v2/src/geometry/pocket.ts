// src/geometry/pocket.ts
import type { Point } from "../types";
import { buildOffset } from "./offset";

function round(value: number): number {
  return Number(value.toFixed(4));
}

function normalizeClosed(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  const d = Math.hypot(first.x - last.x, first.y - last.y);
  if (d <= 1e-6) return points.slice(0, -1);
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
  if (Math.abs(area) < 1e-10) return points[0];
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-10) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
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
  const maxSafetyIter = 50;

  for (let i = 0; i < maxSafetyIter; i++) {
    // buildOffset expects offset > 0 for INWARD.
    const loops = buildOffset(base, currentOffset, "round", 4);
    if (loops.length === 0) break;
    paths.push(...loops);
    currentOffset += stepover;
  }

  if (keepCenterCleanup) {
    const c = centroid(base);
    if (pointInPolygon(c, base)) {
       const d = 0.05;
       paths.push([
         { x: round(c.x - d), y: round(c.y - d) },
         { x: round(c.x + d), y: round(c.y - d) },
         { x: round(c.x + d), y: round(c.y + d) },
         { x: round(c.x - d), y: round(c.y + d) },
         { x: round(c.x - d), y: round(c.y - d) },
       ]);
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
  // For now, we only handle the first external contour.
  // Real CAM would classify holes and external boundaries.
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
  // Parallel fill is harder to implement robustly without a clipper library.
  // Fall back to offset.
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

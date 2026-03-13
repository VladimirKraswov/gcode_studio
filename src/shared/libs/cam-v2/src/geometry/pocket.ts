// src/geometry/pocket.ts

import type { Point } from "../types";
import { classifyContours, pointInPolygon } from "./classifier";
import { buildOffset } from "./offset";

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

function boundsOf(polygon: Point[]) {
  return {
    minX: Math.min(...polygon.map((p) => p.x)),
    maxX: Math.max(...polygon.map((p) => p.x)),
    minY: Math.min(...polygon.map((p) => p.y)),
    maxY: Math.max(...polygon.map((p) => p.y)),
  };
}

function segmentInsidePocketArea(a: Point, b: Point, outer: Point[], holes: Point[][]): boolean {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (!pointInPolygon(mid, outer)) return false;
  for (const hole of holes) if (pointInPolygon(mid, hole)) return false;
  return true;
}

function connectZigzagSegments(segments: Point[][]): Point[][] {
  if (segments.length === 0) return [];

  const result: Point[][] = [];
  let current: Point[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = i % 2 === 0 ? segments[i] : [...segments[i]].reverse();

    if (current.length === 0) {
      current.push(...segment);
      continue;
    }

    const last = current[current.length - 1];
    const first = segment[0];

    if (distance(last, first) <= EPS * 10) current.push(...segment.slice(1));
    else {
      result.push(current);
      current = [...segment];
    }
  }

  if (current.length >= 2) result.push(current);
  return result;
}

function generateParallelPocketForRegion(
  outer: Point[],
  holes: Point[][],
  step: number,
  angle = 0
): Point[][] {
  if (outer.length < 3 || step <= EPS) return [];
  void angle;

  const bounds = boundsOf(outer);
  const segments: Point[][] = [];

  for (let y = bounds.minY; y <= bounds.maxY + EPS; y += step) {
    const intersections: number[] = [];

    const accumulateIntersections = (polygon: Point[]) => {
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        if (Math.abs(a.y - b.y) <= EPS) continue;

        const ymin = Math.min(a.y, b.y);
        const ymax = Math.max(a.y, b.y);
        if (y < ymin || y > ymax) continue;

        const t = (y - a.y) / (b.y - a.y);
        if (t < -EPS || t > 1 + EPS) continue;
        intersections.push(a.x + t * (b.x - a.x));
      }
    };

    accumulateIntersections(outer);
    intersections.sort((a, b) => a - b);

    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const x1 = intersections[i];
      const x2 = intersections[i + 1];
      if (Math.abs(x2 - x1) <= EPS) continue;

      const a = { x: round(x1), y: round(y) };
      const b = { x: round(x2), y: round(y) };
      if (segmentInsidePocketArea(a, b, outer, holes)) segments.push([a, b]);
    }
  }

  return connectZigzagSegments(segments);
}

export function buildPocketOffsets(
  polyline: Point[],
  toolRadius: number,
  stepover: number,
  keepCenterCleanup = true
): Point[][] {
  const base = normalizeClosed(polyline);
  if (base.length < 3 || toolRadius <= EPS || stepover <= EPS) return [];

  const paths: Point[][] = [];
  let currentLoops = buildOffset(base, -toolRadius, "round", 4);

  while (currentLoops.length > 0) {
    const validLoops = currentLoops.filter((l) => l.length >= 4);
    if (validLoops.length === 0) break;

    for (const loop of validLoops) {
      paths.push(loop);
    }

    // Generate next set of offsets from ALL current valid loops
    const nextLoops: Point[][] = [];
    for (const loop of validLoops) {
      const next = buildOffset(loop.slice(0, -1), -stepover, "round", 4);
      nextLoops.push(...next);
    }

    if (nextLoops.length === 0) break;
    currentLoops = nextLoops;
  }

  if (keepCenterCleanup) {
    const c = centroid(base);
    if (pointInPolygon(c, base)) {
       const tinyBox = [
        { x: c.x - 0.01, y: c.y - 0.01 },
        { x: c.x + 0.01, y: c.y - 0.01 },
        { x: c.x + 0.01, y: c.y + 0.01 },
        { x: c.x - 0.01, y: c.y + 0.01 },
        { x: c.x - 0.01, y: c.y - 0.01 },
      ];
      if (paths.length === 0) {
        paths.push(tinyBox);
      }
    }
  }

  return paths;
}

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / Math.max(points.length, 1), y: sum.y / Math.max(points.length, 1) };
}


export function generateOffsetPocketWithHoles(
  contours: Point[][],
  toolRadius: number,
  step: number
): Point[][] {
  const normalized = contours.map(normalizeClosed).filter((c) => c.length >= 3);
  if (normalized.length === 0 || step <= EPS) return [];

  const classified = classifyContours(normalized);
  const result: Point[][] = [];

  for (let extIndex = 0; extIndex < classified.external.length; extIndex++) {
    const outer = classified.external[extIndex];
    const loops = buildPocketOffsets(outer, toolRadius, step, true);
    result.push(...loops);
  }

  return result;
}

export function generateParallelPocketWithHoles(
  contours: Point[][],
  toolRadius: number,
  step: number,
  angle = 0
): Point[][] {
  const normalized = contours.map(normalizeClosed).filter((c) => c.length >= 3);
  if (normalized.length === 0 || step <= EPS) return [];

  const classified = classifyContours(normalized);
  const result: Point[][] = [];

  for (let extIndex = 0; extIndex < classified.external.length; extIndex++) {
    const outer = classified.external[extIndex];
    const holeIndices = classified.holes.get(extIndex) ?? [];
    const holes = holeIndices.map((idx) => normalized[idx]);

    // Offset the boundary and holes by toolRadius to avoid overcutting
    const offsetOuter = buildOffset(outer, -toolRadius, "round", 4);
    if (offsetOuter.length === 0) continue;

    const offsetHoles = holes.flatMap((h) => buildOffset(h, toolRadius, "round", 4));

    for (const loop of offsetOuter) {
      result.push(...generateParallelPocketForRegion(loop, offsetHoles, step, angle));
    }
  }

  return result;
}

export function generateBestPocket(
  contours: Point[][],
  toolRadius: number,
  step: number,
  angle = 0
): Point[][] {
  const normalized = contours.map(normalizeClosed).filter((c) => c.length >= 3);
  if (normalized.length === 0 || step <= EPS) return [];

  const classified = classifyContours(normalized);
  const hasHoles = Array.from(classified.holes.values()).some((items) => items.length > 0);

  if (hasHoles) {
    const parallel = generateParallelPocketWithHoles(normalized, toolRadius, step, angle);
    if (parallel.length > 0) return parallel;
  }

  const offsetPocket = generateOffsetPocketWithHoles(normalized, toolRadius, step);
  if (offsetPocket.length > 0) return offsetPocket;

  return generateParallelPocketWithHoles(normalized, toolRadius, step, angle);
}

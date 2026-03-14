// src/geometry/pocket.ts
import type { Point } from "../types";
import { classifyContours } from "./classifier";
import {
  closePolygon,
  ensurePolygonOrientation,
  inflatePolygons,
  normalizePolygon,
  pointInPolygonKernel,
  polygonDifference,
  polygonUnion,
} from "./kernel/clipperKernel";
import { EPS } from "./polygon";

type Paths = Point[][];

type Region = {
  shells: Paths;
  holes: Paths;
};

type Interval = {
  x1: number;
  x2: number;
};

function round(value: number): number {
  return Number(value.toFixed(6));
}

function rp(p: Point): Point {
  return { x: round(p.x), y: round(p.y) };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  return pointInPolygonKernel(point, polygon);
}

function pointInRegion(point: Point, region: Region): boolean {
  const inShell = region.shells.some((shell) => pointInPolygon(point, shell));
  if (!inShell) return false;
  return !region.holes.some((hole) => pointInPolygon(point, hole));
}

function boundsOf(paths: Paths) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const p of path) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  return { minX, minY, maxX, maxY };
}

function rotatePoint(p: Point, origin: Point, angleRad: number): Point {
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return {
    x: round(origin.x + dx * c - dy * s),
    y: round(origin.y + dx * s + dy * c),
  };
}

function rotatePaths(paths: Paths, origin: Point, angleRad: number): Paths {
  return paths.map((path) => path.map((p) => rotatePoint(p, origin, angleRad)));
}

function offsetPaths(paths: Paths, deltaMm: number): Paths {
  if (paths.length === 0) return [];
  return inflatePolygons(paths, deltaMm, "round", 2);
}

function unionPaths(paths: Paths): Paths {
  return polygonUnion(paths);
}

function differencePaths(subject: Paths, clip: Paths): Paths {
  return polygonDifference(subject, clip);
}

function regionFromLoops(loops: Paths): Region {
  const normalized = loops
    .map((loop) => normalizePolygon(loop))
    .filter((loop) => loop.length >= 3);

  if (normalized.length === 0) {
    return { shells: [], holes: [] };
  }

  const classified = classifyContours(normalized);
  const shells = classified.external.map((path) => ensurePolygonOrientation(path, false));

  const holes: Paths = [];
  classified.external.forEach((_, externalIndex) => {
    const holeIndices = classified.holes.get(externalIndex) ?? [];
    for (const holeIndex of holeIndices) {
      const hole = normalized[holeIndex];
      if (hole.length >= 3) holes.push(ensurePolygonOrientation(hole, true));
    }
  });

  return { shells, holes };
}

function buildMachiningRegion(
  outer: Point[],
  holes: Paths,
  toolRadius: number
): Region {
  const safeOuter = offsetPaths([ensurePolygonOrientation(outer, false)], -toolRadius);
  if (safeOuter.length === 0) return { shells: [], holes: [] };

  const grownHoles =
    holes.length > 0 ? offsetPaths(holes.map((h) => ensurePolygonOrientation(h, false)), toolRadius) : [];

  const safeArea = differencePaths(safeOuter, grownHoles);
  return regionFromLoops(safeArea);
}

function cleanupOpenSegment(segment: Point[]): Point[] {
  if (segment.length < 2) return [];
  const a = rp(segment[0]);
  const b = rp(segment[segment.length - 1]);
  if (dist(a, b) <= EPS) return [];
  return [a, b];
}

function polygonIntersectionsAtY(polygon: Point[], y: number): number[] {
  const loop = closePolygon(polygon);
  const xs: number[] = [];

  for (let i = 0; i < loop.length - 1; i++) {
    const a = loop[i];
    const b = loop[i + 1];

    if (Math.abs(a.y - b.y) <= EPS) continue;

    const yMin = Math.min(a.y, b.y);
    const yMax = Math.max(a.y, b.y);

    if (y < yMin || y >= yMax) continue;

    const t = (y - a.y) / (b.y - a.y);
    xs.push(round(a.x + (b.x - a.x) * t));
  }

  xs.sort((a, b) => a - b);

  const deduped: number[] = [];
  for (const x of xs) {
    if (deduped.length === 0 || Math.abs(deduped[deduped.length - 1] - x) > 1e-5) {
      deduped.push(x);
    }
  }

  return deduped;
}

function intervalsFromPolygonAtY(polygon: Point[], y: number) {
  const xs = polygonIntersectionsAtY(polygon, y);
  const intervals: Interval[] = [];

  for (let i = 0; i + 1 < xs.length; i += 2) {
    const x1 = xs[i];
    const x2 = xs[i + 1];
    if (x2 - x1 > EPS) intervals.push({ x1, x2 });
  }

  return intervals;
}

function subtractIntervals(base: Interval[], cuts: Interval[]): Interval[] {
  if (base.length === 0) return [];
  if (cuts.length === 0) return base;

  const result: Interval[] = [];

  for (const src of base) {
    let pieces: Interval[] = [src];

    for (const cut of cuts) {
      const next: Interval[] = [];

      for (const piece of pieces) {
        const left = Math.max(piece.x1, cut.x1);
        const right = Math.min(piece.x2, cut.x2);

        if (right <= left + EPS) {
          next.push(piece);
          continue;
        }

        if (piece.x1 < left - EPS) next.push({ x1: piece.x1, x2: left });
        if (right < piece.x2 - EPS) next.push({ x1: right, x2: piece.x2 });
      }

      pieces = next;
      if (pieces.length === 0) break;
    }

    result.push(...pieces);
  }

  return result;
}

function regionIntervalsAtY(region: Region, y: number): Interval[] {
  const holeCuts = region.holes.flatMap((hole) => intervalsFromPolygonAtY(hole, y));
  const out: Interval[] = [];

  for (const shell of region.shells) {
    const shellIntervals = intervalsFromPolygonAtY(shell, y);
    const carved = subtractIntervals(shellIntervals, holeCuts);

    for (const seg of carved) {
      if (seg.x2 - seg.x1 > EPS) out.push(seg);
    }
  }

  out.sort((a, b) => a.x1 - b.x1 || a.x2 - b.x2);
  return out;
}

function generateScanlineSegments(region: Region, stepover: number, angleDeg = 0): Paths {
  const allLoops = [...region.shells, ...region.holes];
  if (allLoops.length === 0) return [];

  const box = boundsOf(allLoops);
  const origin = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };

  const angleRad = (angleDeg * Math.PI) / 180;
  const rotatedRegion =
    Math.abs(angleRad) > 1e-9
      ? {
          shells: rotatePaths(region.shells, origin, -angleRad),
          holes: rotatePaths(region.holes, origin, -angleRad),
        }
      : region;

  const rotatedLoops = [...rotatedRegion.shells, ...rotatedRegion.holes];
  const { minY, maxY } = boundsOf(rotatedLoops);
  if (!Number.isFinite(minY) || !Number.isFinite(maxY) || maxY - minY <= EPS) return [];

  const spacing = Math.max(0.05, stepover);
  const lineCount = Math.max(1, Math.ceil((maxY - minY) / spacing));
  const paths: Paths = [];

  for (let i = 0; i <= lineCount; i++) {
    const rawY = i === lineCount ? maxY - EPS : minY + i * spacing + EPS;
    const y = Math.max(minY + EPS, Math.min(maxY - EPS, rawY));

    const intervals = regionIntervalsAtY(rotatedRegion, y);
    if (intervals.length === 0) continue;

    const rowSegments: Paths = [];

    for (const seg of intervals) {
      const width = seg.x2 - seg.x1;
      if (width <= EPS) continue;

      const mid = { x: (seg.x1 + seg.x2) / 2, y };
      if (!pointInRegion(mid, rotatedRegion)) continue;

      const inset = Math.min(0.02, Math.max(0.001, width * 0.02));
      if (width <= inset * 2) continue;

      const cleaned = cleanupOpenSegment([
        { x: seg.x1 + inset, y },
        { x: seg.x2 - inset, y },
      ]);

      if (cleaned.length === 2) rowSegments.push(cleaned);
    }

    if (rowSegments.length === 0) continue;

    if (i % 2 === 1) rowSegments.reverse();

    for (let j = 0; j < rowSegments.length; j++) {
      const seg = rowSegments[j];
      const oriented = (i + j) % 2 === 1 ? [...seg].reverse() : seg;

      const restored =
        Math.abs(angleRad) > 1e-9
          ? oriented.map((p) => rotatePoint(p, origin, angleRad))
          : oriented.map(rp);

      if (cleanupOpenSegment(restored).length === 2) {
        paths.push(restored);
      }
    }
  }

  return paths;
}

function boundaryLoops(region: Region): Paths {
  const paths: Paths = [];
  for (const shell of region.shells) {
    const loop = closePolygon(shell);
    if (loop.length >= 4) paths.push(loop);
  }
  return paths;
}

function buildPocketPaths(
  outer: Point[],
  holes: Paths,
  toolRadius: number,
  stepover: number,
  angleDeg: number,
  includeBoundary: boolean
): Paths {
  const region = buildMachiningRegion(outer, holes, toolRadius);
  if (region.shells.length === 0) return [];

  const paths: Paths = [];
  if (includeBoundary) paths.push(...boundaryLoops(region));
  paths.push(...generateScanlineSegments(region, stepover, angleDeg));
  return paths;
}

export function buildPocketOffsets(
  polyline: Point[],
  toolRadius: number,
  stepover: number,
  keepCenterCleanup = true
): Paths {
  void keepCenterCleanup;
  return buildPocketPaths(polyline, [], toolRadius, stepover, 0, true);
}

export function generateOffsetPocketWithHoles(
  contours: Paths,
  toolRadius: number,
  step: number
): Paths {
  if (contours.length === 0) return [];

  const normalized = contours
    .map((contour) => ensurePolygonOrientation(normalizePolygon(contour), false))
    .filter((contour) => contour.length >= 3);

  if (normalized.length === 0) return [];

  const classified = classifyContours(normalized);
  const paths: Paths = [];

  classified.external.forEach((outer, externalIndex) => {
    const holeIndices = classified.holes.get(externalIndex) ?? [];
    const holes = holeIndices
      .map((index) => normalized[index])
      .filter((hole) => hole.length >= 3)
      .map((hole) => ensurePolygonOrientation(hole, false));

    paths.push(...buildPocketPaths(outer, holes, toolRadius, step, 0, true));
  });

  return paths;
}

export function generateParallelPocketWithHoles(
  contours: Paths,
  toolRadius: number,
  step: number,
  angle = 0
): Paths {
  if (contours.length === 0) return [];

  const normalized = contours
    .map((contour) => ensurePolygonOrientation(normalizePolygon(contour), false))
    .filter((contour) => contour.length >= 3);

  if (normalized.length === 0) return [];

  const classified = classifyContours(normalized);
  const paths: Paths = [];

  classified.external.forEach((outer, externalIndex) => {
    const holeIndices = classified.holes.get(externalIndex) ?? [];
    const holes = holeIndices
      .map((index) => normalized[index])
      .filter((hole) => hole.length >= 3)
      .map((hole) => ensurePolygonOrientation(hole, false));

    paths.push(...buildPocketPaths(outer, holes, toolRadius, step, angle, false));
  });

  return paths;
}

export function generateBestPocket(
  contours: Paths,
  toolRadius: number,
  step: number,
  angle = 0
): Paths {
  if (contours.length === 0) return [];

  const normalized = contours
    .map((contour) => ensurePolygonOrientation(normalizePolygon(contour), false))
    .filter((contour) => contour.length >= 3);

  if (normalized.length === 0) return [];

  const classified = classifyContours(normalized);
  const paths: Paths = [];

  classified.external.forEach((outer, externalIndex) => {
    const holeIndices = classified.holes.get(externalIndex) ?? [];
    const holes = holeIndices
      .map((index) => normalized[index])
      .filter((hole) => hole.length >= 3)
      .map((hole) => ensurePolygonOrientation(hole, false));

    const region = buildMachiningRegion(outer, holes, toolRadius);
    if (region.shells.length === 0) return;

    const box = boundsOf([...region.shells, ...region.holes]);
    const width = box.maxX - box.minX;
    const height = box.maxY - box.minY;

    const elongated =
      Math.max(width, height) / Math.max(1e-9, Math.min(width, height)) > 1.35;

    if (elongated) {
      paths.push(...buildPocketPaths(outer, holes, toolRadius, step, angle, false));
    } else {
      paths.push(...buildPocketPaths(outer, holes, toolRadius, step, 0, true));
    }
  });

  return paths;
}
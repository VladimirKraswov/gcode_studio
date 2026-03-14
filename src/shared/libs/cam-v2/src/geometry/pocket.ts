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
import { EPS, pointsEqual } from "./polygon";

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

function isClosedLoop(path: Point[]): boolean {
  if (path.length < 2) return false;
  return pointsEqual(path[0], path[path.length - 1], 1e-6);
}

function normalizeOpenPath(path: Point[]): Point[] {
  if (path.length === 0) return [];
  const out: Point[] = [];
  for (const src of path) {
    const p = rp(src);
    if (out.length === 0 || dist(out[out.length - 1], p) > 1e-6) {
      out.push(p);
    }
  }
  return out;
}

function normalizeClosedLoop(path: Point[]): Point[] {
  const open = normalizePolygon(path).map(rp);
  if (open.length < 3) return [];
  return ensurePolygonOrientation(open, false);
}

function cleanClosedLoop(path: Point[]): Point[] {
  const open = normalizeClosedLoop(path);
  if (open.length < 3) return [];
  const closed = closePolygon(open).map(rp);
  if (closed.length < 4) return [];
  return closed;
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
  return inflatePolygons(paths, deltaMm, "round", 2)
    .map(normalizeClosedLoop)
    .filter((loop) => loop.length >= 3);
}

function unionPaths(paths: Paths): Paths {
  return polygonUnion(paths)
    .map(normalizeClosedLoop)
    .filter((loop) => loop.length >= 3);
}

function differencePaths(subject: Paths, clip: Paths): Paths {
  return polygonDifference(subject, clip)
    .map(normalizeClosedLoop)
    .filter((loop) => loop.length >= 3);
}

function regionFromLoops(loops: Paths): Region {
  const normalized = loops
    .map(normalizeClosedLoop)
    .filter((loop) => loop.length >= 3);

  if (normalized.length === 0) {
    return { shells: [], holes: [] };
  }

  const classified = classifyContours(normalized);
  const shells = classified.external
    .map((path) => ensurePolygonOrientation(path, false))
    .filter((path) => path.length >= 3);

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
  const safeOuter = offsetPaths([ensurePolygonOrientation(normalizePolygon(outer), false)], -toolRadius);
  if (safeOuter.length === 0) return { shells: [], holes: [] };

  const grownHoles =
    holes.length > 0
      ? offsetPaths(
          holes.map((h) => ensurePolygonOrientation(normalizePolygon(h), false)),
          toolRadius
        )
      : [];

  const safeArea = differencePaths(safeOuter, grownHoles);
  return regionFromLoops(safeArea);
}

function cleanupOpenSegment(segment: Point[]): Point[] {
  if (segment.length < 2) return [];
  const clean = normalizeOpenPath(segment);
  if (clean.length < 2) return [];
  const a = clean[0];
  const b = clean[clean.length - 1];
  if (dist(a, b) <= EPS) return [];
  return [a, b];
}

function polygonIntersectionsAtY(polygon: Point[], y: number): number[] {
  const loop = cleanClosedLoop(polygon);
  const xs: number[] = [];
  if (loop.length < 4) return xs;

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

function intervalsFromPolygonAtY(polygon: Point[], y: number): Interval[] {
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

function segmentMidpoint(seg: Point[]): Point {
  return {
    x: (seg[0].x + seg[1].x) / 2,
    y: (seg[0].y + seg[1].y) / 2,
  };
}

function connectable(a: Point[], b: Point[], tolerance: number): boolean {
  if (a.length < 2 || b.length < 2) return false;
  return dist(a[a.length - 1], b[0]) <= tolerance;
}

function mergeSegmentsIntoOpenPaths(segments: Paths, bridgeTolerance: number): Paths {
  if (segments.length === 0) return [];

  const result: Paths = [];
  let current = [...segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    if (connectable(current, next, bridgeTolerance)) {
      current = [...current, ...next.slice(1)];
    } else {
      result.push(normalizeOpenPath(current));
      current = [...next];
    }
  }

  result.push(normalizeOpenPath(current));

  return result.filter((path) => path.length >= 2);
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
  const rows: Paths = [];

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

      const cleaned = cleanupOpenSegment(restored);
      if (cleaned.length === 2) rows.push(cleaned);
    }
  }

  return mergeSegmentsIntoOpenPaths(rows, Math.max(0.05, stepover * 0.75));
}

function boundaryLoops(region: Region): Paths {
  const paths: Paths = [];
  for (const shell of region.shells) {
    const loop = cleanClosedLoop(shell);
    if (loop.length >= 4) paths.push(loop);
  }
  return paths;
}

function generateOffsetRings(region: Region, stepover: number): Paths {
  const paths: Paths = [];
  if (region.shells.length === 0) return paths;

  let currentShells = unionPaths(region.shells);
  let iteration = 0;
  const maxIterations = 10000;

  while (currentShells.length > 0 && iteration < maxIterations) {
    for (const shell of currentShells) {
      const loop = cleanClosedLoop(shell);
      if (loop.length >= 4) paths.push(loop);
    }

    const next = offsetPaths(currentShells, -stepover);
    if (next.length === 0) break;

    currentShells = next;
    iteration++;
  }

  return paths;
}

function buildPocketPaths(
  outer: Point[],
  holes: Paths,
  toolRadius: number,
  stepover: number,
  angleDeg: number,
  includeBoundary: boolean,
  mode: "offset" | "parallel" | "auto"
): Paths {
  const region = buildMachiningRegion(outer, holes, toolRadius);
  if (region.shells.length === 0) return [];

  if (mode === "offset") {
    return generateOffsetRings(region, Math.max(0.05, stepover));
  }

  if (mode === "parallel") {
    return generateScanlineSegments(region, stepover, angleDeg);
  }

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
  return buildPocketPaths(polyline, [], toolRadius, stepover, 0, true, "offset");
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

    paths.push(...buildPocketPaths(outer, holes, toolRadius, step, 0, true, "offset"));
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

    paths.push(...buildPocketPaths(outer, holes, toolRadius, step, angle, false, "parallel"));
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
      paths.push(...buildPocketPaths(outer, holes, toolRadius, step, angle, false, "parallel"));
    } else {
      paths.push(...buildPocketPaths(outer, holes, toolRadius, step, 0, true, "offset"));
    }
  });

  return paths;
}
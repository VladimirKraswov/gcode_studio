// src/geometry/kernel/clipperKernel.ts
import type { JoinType as CamJoinType, Point } from "../../types";
import {
  closeLoop,
  ensureCCW,
  ensureCW,
  normalizeClosed,
  roundPoint,
  signedArea,
} from "../polygon";
import {
  Clipper,
  EndType,
  FillRule,
  JoinType,
  Path64,
  Paths64,
  Point64,
  PointInPolygonResult,
} from "../internal";

export type Paths = Point[][];

const SCALE = 1000;

function toPoint64(p: Point): Point64 {
  return new Point64(Math.round(p.x * SCALE), Math.round(p.y * SCALE));
}

function fromPoint64(p: { x: number; y: number }): Point {
  return roundPoint({
    x: p.x / SCALE,
    y: p.y / SCALE,
  });
}

function toPath64(points: Point[]): Path64 {
  const open = normalizeClosed(points);
  const path = new Path64();
  for (const p of open) path.push(toPoint64(p));
  return path;
}

function toPaths64(paths: Paths): Paths64 {
  const result = new Paths64();
  for (const path of paths) {
    const converted = toPath64(path);
    if (converted.length >= 3) result.push(converted);
  }
  return result;
}

function fromPaths64(paths: Paths64): Paths {
  const result: Paths = [];

  for (const path of paths) {
    const out: Point[] = [];
    for (const p of path) out.push(fromPoint64(p));

    const open = normalizeClosed(out);
    if (open.length >= 3 && Math.abs(signedArea(open)) > 1e-8) {
      result.push(open);
    }
  }

  return result;
}

function toClipperJoinType(joinType: CamJoinType): JoinType {
  return joinType === "miter" ? JoinType.Miter : JoinType.Round;
}

export function normalizePolygon(path: Point[]): Point[] {
  return normalizeClosed(path);
}

export function ensurePolygonOrientation(path: Point[], clockwise: boolean): Point[] {
  return clockwise ? ensureCW(path) : ensureCCW(path);
}

export function closePolygon(path: Point[]): Point[] {
  return closeLoop(path);
}

export function inflatePolygons(
  paths: Paths,
  delta: number,
  joinType: CamJoinType = "round",
  miterLimit = 4
): Paths {
  if (paths.length === 0) return [];

  const result = Clipper.InflatePaths(
    toPaths64(paths),
    Math.round(delta * SCALE),
    toClipperJoinType(joinType),
    EndType.Polygon,
    miterLimit
  );

  return fromPaths64(result);
}

export function polygonUnion(paths: Paths): Paths {
  if (paths.length === 0) return [];
  return fromPaths64(Clipper.Union(toPaths64(paths), undefined, FillRule.NonZero));
}

export function polygonDifference(subject: Paths, clip: Paths): Paths {
  if (subject.length === 0) return [];
  if (clip.length === 0) return polygonUnion(subject);

  return fromPaths64(
    Clipper.Difference(toPaths64(subject), toPaths64(clip), FillRule.NonZero)
  );
}

export function polygonIntersection(subject: Paths, clip: Paths): Paths {
  if (subject.length === 0 || clip.length === 0) return [];

  return fromPaths64(
    Clipper.Intersect(toPaths64(subject), toPaths64(clip), FillRule.NonZero)
  );
}

export function pointInPolygonKernel(point: Point, polygon: Point[]): boolean {
  const path = toPath64(closeLoop(polygon));
  if (path.length < 3) return false;

  const pip = Clipper.pointInPolygon(toPoint64(point), path);
  return pip === PointInPolygonResult.IsInside || pip === PointInPolygonResult.IsOn;
}
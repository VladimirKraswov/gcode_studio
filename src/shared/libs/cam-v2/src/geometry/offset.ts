// src/geometry/offset.ts
import type { JoinType, Point } from "../types";
import {
  closePolygon,
  ensurePolygonOrientation,
  inflatePolygons,
  normalizePolygon,
  pointInPolygonKernel,
} from "./kernel/clipperKernel";

const DEFAULT_MITER_LIMIT = 4;

export { pointInPolygonKernel as pointInPolygon } from "./kernel/clipperKernel";

export function buildOffset(
  polyline: Point[],
  offset: number,
  joinType: JoinType = "round",
  miterLimit = DEFAULT_MITER_LIMIT
): Point[][] {
  const src = normalizePolygon(polyline);
  if (src.length < 3) return [];

  if (Math.abs(offset) < 1e-8) {
    const oriented = ensurePolygonOrientation(src, false);
    return [closePolygon(oriented)];
  }

  const result = inflatePolygons([src], offset, joinType, miterLimit);

  return result
    .map((loop) => ensurePolygonOrientation(loop, false))
    .filter((loop) => loop.length >= 3)
    .map((loop) => closePolygon(loop));
}
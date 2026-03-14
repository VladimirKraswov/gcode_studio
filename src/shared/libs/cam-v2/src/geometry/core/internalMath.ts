// src/geometry/core/internalMath.ts

import { MidpointRounding } from "./enums";
import type { IPoint64 } from "./path64";
import { Point64, Path64 } from "./path64";
import { PointInPolygonResult } from "../boolean/clipperEngine";

export function midPointRound(
  value: number,
  mode: MidpointRounding = MidpointRounding.ToEven
): number {
  const factor = Math.pow(10, 0);
  value *= factor;

  let rounded: number;
  if (mode === MidpointRounding.AwayFromZero) {
    rounded = value > 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
  } else {
    rounded = Math.round(value);
  }

  return rounded / factor;
}

export class InternalClipper {
  static readonly MaxInt64 = 9223372036854775807;
  static readonly MaxCoord = InternalClipper.MaxInt64 / 4;
  static readonly max_coord = InternalClipper.MaxCoord;
  static readonly min_coord = -InternalClipper.MaxCoord;
  static readonly Invalid64 = InternalClipper.MaxInt64;

  static readonly defaultArcTolerance = 0.25;
  static readonly floatingPointTolerance = 1e-12;
  static readonly defaultMinimumEdgeLength = 0.1;

  private static readonly precision_range_error = "Error: Precision is out of range.";

  static checkPrecision(precision: number): void {
    if (precision < -8 || precision > 8) {
      throw new Error(this.precision_range_error);
    }
  }

  static isAlmostZero(value: number): boolean {
    return Math.abs(value) <= this.floatingPointTolerance;
  }

  static crossProduct(pt1: IPoint64, pt2: IPoint64, pt3: IPoint64): number {
    return (pt2.x - pt1.x) * (pt3.y - pt2.y) - (pt2.y - pt1.y) * (pt3.x - pt2.x);
  }

  static dotProduct(pt1: IPoint64, pt2: IPoint64, pt3: IPoint64): number {
    return (pt2.x - pt1.x) * (pt3.x - pt2.x) + (pt2.y - pt1.y) * (pt3.y - pt2.y);
  }

  static checkCastInt64(val: number): number {
    if (val >= this.max_coord || val <= this.min_coord) return this.Invalid64;
    return midPointRound(val, MidpointRounding.AwayFromZero);
  }

  public static getIntersectPoint(
    ln1a: IPoint64,
    ln1b: IPoint64,
    ln2a: IPoint64,
    ln2b: IPoint64
  ): { ip: IPoint64; success: boolean } {
    const dy1 = ln1b.y - ln1a.y;
    const dx1 = ln1b.x - ln1a.x;
    const dy2 = ln2b.y - ln2a.y;
    const dx2 = ln2b.x - ln2a.x;
    const det = dy1 * dx2 - dy2 * dx1;

    let ip: IPoint64;

    if (det === 0.0) {
      ip = new Point64(0, 0);
      return { ip, success: false };
    }

    const t = ((ln1a.x - ln2a.x) * dy2 - (ln1a.y - ln2a.y) * dx2) / det;
    if (t <= 0.0) ip = ln1a;
    else if (t >= 1.0) ip = ln1b;
    else ip = new Point64(Math.trunc(ln1a.x + t * dx1), Math.trunc(ln1a.y + t * dy1));

    return { ip, success: true };
  }

  public static segsIntersect(
    seg1a: IPoint64,
    seg1b: IPoint64,
    seg2a: IPoint64,
    seg2b: IPoint64,
    inclusive = false
  ): boolean {
    if (inclusive) {
      const res1 = InternalClipper.crossProduct(seg1a, seg2a, seg2b);
      const res2 = InternalClipper.crossProduct(seg1b, seg2a, seg2b);
      if (res1 * res2 > 0) return false;

      const res3 = InternalClipper.crossProduct(seg2a, seg1a, seg1b);
      const res4 = InternalClipper.crossProduct(seg2b, seg1a, seg1b);
      if (res3 * res4 > 0) return false;

      return res1 !== 0 || res2 !== 0 || res3 !== 0 || res4 !== 0;
    }

    return (
      InternalClipper.crossProduct(seg1a, seg2a, seg2b) *
        InternalClipper.crossProduct(seg1b, seg2a, seg2b) <
        0 &&
      InternalClipper.crossProduct(seg2a, seg1a, seg1b) *
        InternalClipper.crossProduct(seg2b, seg1a, seg1b) <
        0
    );
  }

  public static getClosestPtOnSegment(offPt: IPoint64, seg1: IPoint64, seg2: IPoint64): IPoint64 {
    if (seg1.x === seg2.x && seg1.y === seg2.y) return seg1;

    const dx = seg2.x - seg1.x;
    const dy = seg2.y - seg1.y;
    let q = ((offPt.x - seg1.x) * dx + (offPt.y - seg1.y) * dy) / (dx * dx + dy * dy);
    q = Math.max(0, Math.min(1, q));

    return new Point64(
      seg1.x + midPointRound(q * dx, MidpointRounding.ToEven),
      seg1.y + midPointRound(q * dy, MidpointRounding.ToEven)
    );
  }

  public static pointInPolygon(pt: IPoint64, polygon: Path64): PointInPolygonResult {
    const len = polygon.length;
    let start = 0;

    if (len < 3) return PointInPolygonResult.IsOutside;

    while (start < len && polygon[start].y === pt.y) start++;
    if (start === len) return PointInPolygonResult.IsOutside;

    let d = 0;
    let isAbove = polygon[start].y < pt.y;
    const startingAbove = isAbove;
    let val = 0;
    let i = start + 1;
    let end = len;

    for (;;) {
      if (i === end) {
        if (end === 0 || start === 0) break;
        end = start;
        i = 0;
      }

      if (isAbove) {
        while (i < end && polygon[i].y < pt.y) i++;
        if (i === end) continue;
      } else {
        while (i < end && polygon[i].y > pt.y) i++;
        if (i === end) continue;
      }

      const curr = polygon[i];
      const prev = i > 0 ? polygon[i - 1] : polygon[len - 1];

      if (curr.y === pt.y) {
        if (
          curr.x === pt.x ||
          (curr.y === prev.y && (pt.x < prev.x) !== (pt.x < curr.x))
        ) {
          return PointInPolygonResult.IsOn;
        }
        i++;
        if (i === start) break;
        continue;
      }

      if (pt.x > prev.x && pt.x > curr.x) {
        val = 1 - val;
      } else if (!(pt.x < curr.x && pt.x < prev.x)) {
        d = InternalClipper.crossProduct(prev, curr, pt);
        if (d === 0) return PointInPolygonResult.IsOn;
        if ((d < 0) === isAbove) val = 1 - val;
      }

      isAbove = !isAbove;
      i++;
    }

    if (isAbove !== startingAbove) {
      if (i === len) i = 0;
      else d = InternalClipper.crossProduct(polygon[i - 1], polygon[i], pt);
      if (d === 0) return PointInPolygonResult.IsOn;
      if ((d < 0) === isAbove) val = 1 - val;
    }

    return val === 0 ? PointInPolygonResult.IsOutside : PointInPolygonResult.IsInside;
  }
}
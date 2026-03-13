// src/geometry/offset.ts
import type { JoinType, Point } from "../types";

const EPS = 1e-7;
const ROUND_ARC_STEPS_PER_90 = 8;
const DEFAULT_MITER_LIMIT = 4;

type Vec2 = { x: number; y: number };

function round(value: number): number {
  return Number(value.toFixed(4));
}

function rp(p: Point): Point {
  return { x: round(p.x), y: round(p.y) };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eq(a: Point, b: Point, eps = EPS): boolean {
  return dist(a, b) <= eps;
}

function add(a: Point, b: Vec2): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Point, b: Point): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mul(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Vec2): Vec2 {
  const l = len(v);
  if (l <= 1e-10) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

function signedArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function isClockwise(points: Point[]): boolean {
  return signedArea(points) < 0;
}

function dedupeSequential(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    if (out.length === 0 || !eq(out[out.length - 1], p)) out.push(p);
  }
  if (out.length > 1 && eq(out[0], out[out.length - 1])) out.pop();
  return out;
}

function closeLoop(points: Point[]): Point[] {
  const clean = dedupeSequential(points);
  if (clean.length < 3) return clean;
  return [...clean, clean[0]];
}

function lineIntersection(
  p: Point,
  r: Vec2,
  q: Point,
  s: Vec2
): { point: Point; t: number; u: number } | null {
  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-10) return null;
  const qmp = sub(q, p);
  const t = cross(qmp, s) / rxs;
  const u = cross(qmp, r) / rxs;
  return { point: { x: p.x + r.x * t, y: p.y + r.y * t }, t, u };
}

function appendArc(
  out: Point[],
  center: Point,
  radius: number,
  fromAngle: number,
  toAngle: number,
  ccw: boolean
): void {
  let a0 = fromAngle;
  let a1 = toAngle;
  if (ccw) { while (a1 <= a0) a1 += Math.PI * 2; }
  else { while (a1 >= a0) a1 -= Math.PI * 2; }
  const sweep = a1 - a0;
  const segments = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 2)) * ROUND_ARC_STEPS_PER_90);
  for (let i = 1; i <= segments; i++) {
    const t = a0 + (sweep * i) / segments;
    out.push({ x: center.x + radius * Math.cos(t), y: center.y + radius * Math.sin(t) });
  }
}

function rawOffsetLoop(
  polyline: Point[],
  offset: number, // offset > 0 is INWARD
  joinType: JoinType,
  miterLimit: number
): Point[] {
  const base = dedupeSequential(polyline);
  if (base.length < 3) return [];

  const clockwise = isClockwise(base);
  const n = base.length;
  const out: Point[] = [];

  for (let i = 0; i < n; i++) {
    const pPrev = base[(i - 1 + n) % n];
    const pCurr = base[i];
    const pNext = base[(i + 1) % n];

    const d1 = sub(pCurr, pPrev);
    const d2 = sub(pNext, pCurr);
    if (len(d1) < 1e-8 || len(d2) < 1e-8) continue;

    const v1 = normalize(d1);
    const v2 = normalize(d2);

    // Normal that always points INSIDE the polygon
    const n1 = clockwise ? { x: v1.y, y: -v1.x } : { x: -v1.y, y: v1.x };
    const n2 = clockwise ? { x: v2.y, y: -v2.x } : { x: -v2.y, y: v2.x };

    // Move along normal by 'offset'
    const s1p = add(pCurr, mul(n1, offset));
    const s2p = add(pCurr, mul(n2, offset));

    const hit = lineIntersection(s1p, v1, s2p, v2);
    const turn = cross(v1, v2);
    const convex = clockwise ? turn < 0 : turn > 0;

    // Gapping if we move "away" from the corner.
    // Inward (+offset): concave corners gap.
    // Outward (-offset): convex corners gap.
    const gapping = offset > 0 ? !convex : convex;

    if (Math.abs(turn) < 1e-8) {
      out.push(s2p);
      continue;
    }

    if (gapping) {
      if (joinType === "miter" && hit) {
        const miterLen = dist(pCurr, hit.point);
        if (miterLen / Math.abs(offset) <= miterLimit) {
            out.push(hit.point);
        } else {
            out.push(s1p, s2p);
        }
      } else if (joinType === "round") {
        out.push(s1p);
        const a0 = Math.atan2(s1p.y - pCurr.y, s1p.x - pCurr.x);
        const a1 = Math.atan2(s2p.y - pCurr.y, s2p.x - pCurr.x);
        // If CCW and inward, concave gaps. Normal turn is RIGHT. CW arc.
        const ccw = offset > 0 ? clockwise : !clockwise;
        appendArc(out, pCurr, Math.abs(offset), a0, a1, ccw);
        out.push(s2p);
      } else {
        out.push(s1p, s2p);
      }
    } else {
      if (hit) out.push(hit.point);
      else out.push(s1p, s2p);
    }
  }

  return closeLoop(out.map(rp));
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  if (n < 3) return false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-10) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function centroid(points: Point[]): Point {
  let cx = 0, cy = 0, area = 0;
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  for (let i = 0; i < n - 1; i++) {
    const p = points[i], q = points[i + 1];
    const f = p.x * q.y - q.x * p.y;
    area += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  if (Math.abs(area) < 1e-10) return points[0];
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

export function buildOffset(
  polyline: Point[],
  offset: number,
  joinType: JoinType = "round",
  miterLimit = DEFAULT_MITER_LIMIT
): Point[][] {
  const src = dedupeSequential(polyline);
  if (src.length < 3) return [];

  const raw = rawOffsetLoop(src, offset, joinType, miterLimit);
  if (raw.length < 4) return [];

  const loop = closeLoop(dedupeSequential(raw));
  if (loop.length < 4) return [];

  if (offset > 0) { // inward
     const srcClosed = closeLoop(src);
     const c = centroid(loop);
     // Try centroid first, then vertices
     if (pointInPolygon(c, srcClosed)) return [loop];
     for (const p of loop) {
         if (pointInPolygon(p, srcClosed)) return [loop];
     }
     return [];
  }

  return [loop];
}

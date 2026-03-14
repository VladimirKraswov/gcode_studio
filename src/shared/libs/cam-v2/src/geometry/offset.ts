// src/geometry/offset.ts
import type { JoinType, Point } from "../types";

const EPS = 1e-7;
const ROUND_ARC_STEPS_PER_90 = 8;
const DEFAULT_MITER_LIMIT = 4;

type Vec2 = { x: number; y: number };
type Segment = { a: Point; b: Point };
type DirectedEdge = {
  from: number;
  to: number;
  angle: number;
  used: boolean;
};
type Node = Point;

function round(value: number): number {
  return Number(value.toFixed(6));
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

function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

function signedArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
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
  if (eq(clean[0], clean[clean.length-1])) return clean;
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

function segmentIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): { point: Point; ta: number; tb: number } | null {
  const r = sub(a2, a1);
  const s = sub(b2, b1);
  const hit = lineIntersection(a1, r, b1, s);
  if (!hit) return null;
  if (hit.t < -1e-6 || hit.t > 1 + 1e-6 || hit.u < -1e-6 || hit.u > 1 + 1e-6) return null;
  return { point: hit.point, ta: hit.t, tb: hit.u };
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
  offset: number, // offset > 0 is OUTWARD
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

    // CCW (standard): OUTWARD normal is Right turn (dy, -dx)
    // CW: OUTWARD normal is Left turn (-dy, dx)
    const n1 = clockwise ? { x: -v1.y, y: v1.x } : { x: v1.y, y: -v1.x };
    const n2 = clockwise ? { x: -v2.y, y: v2.x } : { x: v2.y, y: -v2.x };

    const s1a = add(pPrev, mul(n1, offset));
    const s1b = add(pCurr, mul(n1, offset));
    const s2a = add(pCurr, mul(n2, offset));

    const hit = lineIntersection(s1a, v1, s2a, v2);

    const turn = cross(v1, v2);
    const convex = clockwise ? turn < 0 : turn > 0;

    // Gapping (adding arcs/multiple points) is needed when the offset
    // moves "away" from the corner, which happens at convex corners
    // for outward offsets and concave corners for inward offsets.
    const gapping = offset > 0 ? convex : !convex;

    if (Math.abs(turn) < 1e-8) {
      out.push(s1b);
      continue;
    }

    if (gapping) {
      if (joinType === "miter" && hit) {
        const miterLen = dist(pCurr, hit.point);
        if (miterLen / Math.abs(offset) <= miterLimit) {
            out.push(hit.point);
        } else {
            out.push(s1b, s2a);
        }
      } else if (joinType === "round") {
        out.push(s1b);
        const a0 = Math.atan2(s1b.y - pCurr.y, s1b.x - pCurr.x);
        const a1 = Math.atan2(s2a.y - pCurr.y, s2a.x - pCurr.x);
        const ccw = offset > 0 ? !clockwise : clockwise;
        appendArc(out, pCurr, Math.abs(offset), a0, a1, ccw);
        out.push(s2a);
      } else {
        out.push(s1b, s2a);
      }
    } else {
      if (hit) out.push(hit.point);
      else out.push(s1b, s2a);
    }
  }

  return closeLoop(out.map(rp));
}

function splitSegmentsAtIntersections(loop: Point[]): Segment[] {
  const closed = closeLoop(loop);
  if (closed.length < 4) return [];

  const baseSegments: Segment[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const a = closed[i], b = closed[i + 1];
    if (!eq(a, b)) baseSegments.push({ a, b });
  }

  const cuts: number[][] = baseSegments.map(() => [0, 1]);
  for (let i = 0; i < baseSegments.length; i++) {
    for (let j = i + 1; j < baseSegments.length; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === baseSegments.length - 1);
      if (adjacent) continue;
      const hit = segmentIntersection(baseSegments[i].a, baseSegments[i].b, baseSegments[j].a, baseSegments[j].b);
      if (!hit) continue;
      if (hit.ta > 1e-6 && hit.ta < 1 - 1e-6) cuts[i].push(hit.ta);
      if (hit.tb > 1e-6 && hit.tb < 1 - 1e-6) cuts[j].push(hit.tb);
    }
  }

  const out: Segment[] = [];
  for (let i = 0; i < baseSegments.length; i++) {
    const seg = baseSegments[i];
    const ts = Array.from(new Set(cuts[i].map(round))).sort((a, b) => a - b);
    for (let k = 0; k < ts.length - 1; k++) {
      const a = rp(add(seg.a, mul(sub(seg.b, seg.a), ts[k])));
      const b = rp(add(seg.a, mul(sub(seg.b, seg.a), ts[k+1])));
      if (!eq(a, b)) out.push({ a, b });
    }
  }
  return out;
}

function buildGraph(segments: Segment[]) {
  const nodeMap = new Map<string, number>();
  const nodes: Node[] = [];
  const getNodeId = (p: Point) => {
    const key = `${round(p.x)}:${round(p.y)}`;
    let id = nodeMap.get(key);
    if (id === undefined) { id = nodes.length; nodes.push(rp(p)); nodeMap.set(key, id); }
    return id;
  };
  const edges: DirectedEdge[] = [];
  for (const s of segments) {
    const a = getNodeId(s.a), b = getNodeId(s.b);
    if (a === b) continue;
    edges.push({ from: a, to: b, angle: angleOf(sub(nodes[b], nodes[a])), used: false });
    edges.push({ from: b, to: a, angle: angleOf(sub(nodes[a], nodes[b])), used: false });
  }
  const outgoing: number[][] = Array.from({ length: nodes.length }, () => []);
  for (let i = 0; i < edges.length; i++) outgoing[edges[i].from].push(i);
  for (const arr of outgoing) arr.sort((ia, ib) => edges[ia].angle - edges[ib].angle);
  return { nodes, edges, outgoing };
}

function traceFace(startIdx: number, _nodes: Node[], edges: DirectedEdge[], outgoing: number[][]) {
  const cycle: number[] = [];
  let currIdx = startIdx;
  const startNode = edges[startIdx].from;

  while (true) {
    const e = edges[currIdx];
    if (e.used) break;
    e.used = true;
    cycle.push(e.from);

    if (e.to === startNode) break;

    let arrivalAngle = e.angle + Math.PI;
    while (arrivalAngle < 0) arrivalAngle += Math.PI * 2;
    while (arrivalAngle >= Math.PI * 2) arrivalAngle -= Math.PI * 2;

    const outs = outgoing[e.to];
    let bestIdx = -1, bestTurn = Infinity;
    for (const candIdx of outs) {
      if (edges[candIdx].used) continue;
      // Rightmost turn: smallest (Arrival - Departure) mod 2PI
      let d = arrivalAngle - edges[candIdx].angle;
      while (d < 1e-9) d += Math.PI * 2;
      while (d > Math.PI * 2 + 1e-9) d -= Math.PI * 2;
      if (d < bestTurn) {
        bestTurn = d;
        bestIdx = candIdx;
      }
    }
    if (bestIdx === -1) break;
    currIdx = bestIdx;
  }
  return cycle;
}

function pointToSegmentDistanceSq(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (a.x + t * dx)) ** 2 + (p.y - (a.y + t * dy)) ** 2;
}

function minDistanceToPolyline(p: Point, polyline: Point[]): number {
  let minD2 = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    minD2 = Math.min(minD2, pointToSegmentDistanceSq(p, polyline[i], polyline[i + 1]));
  }
  return Math.sqrt(minD2);
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  if (n < 3) return false;
  const x = point.x, y = point.y;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    // Robust point-in-polygon with epsilon and boundary handling
    const intersect = ((yi > y) !== (yj > y)) &&
                     (x < (xj - xi) * (y - yi) / (yj - yi || 1e-10) + xi);
    if (intersect) inside = !inside;

    // Exact match on vertex or point on horizontal edge
    const onEdge = Math.abs((xj - xi) * (y - yi) - (x - xi) * (yj - yi)) < 1e-8 &&
                   x >= Math.min(xi, xj) - 1e-8 && x <= Math.max(xi, xj) + 1e-8 &&
                   y >= Math.min(yi, yj) - 1e-8 && y <= Math.max(yi, yj) + 1e-8;
    if (onEdge) return true;
  }
  return inside;
}

function centroid(points: Point[]): Point {
  let cx = 0, cy = 0, area = 0;
  const poly = closeLoop(points);
  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i], q = poly[i + 1];
    const f = p.x * q.y - q.x * p.y;
    area += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
  }
  if (Math.abs(area) < 1e-10) return points[0] || { x: 0, y: 0 };
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

export function buildOffset(
  polyline: Point[],
  offset: number, // offset > 0 is OUTWARD
  joinType: JoinType = "round",
  miterLimit = DEFAULT_MITER_LIMIT
): Point[][] {
  const src = closeLoop(dedupeSequential(polyline));
  if (src.length < 4) return [];
  if (Math.abs(offset) < 1e-8) return [src];

  const raw = rawOffsetLoop(src, offset, joinType, miterLimit);
  if (raw.length < 3) return [];

  const rawClosed = closeLoop(raw);
  const pieces = splitSegmentsAtIntersections(rawClosed);

  if (pieces.length === 0) {
      const c = centroid(rawClosed);
      const inside = pointInPolygon(c, src);
      if (offset > 0 && !inside) return [rawClosed];
      if (offset < 0 && inside) return [rawClosed];
      return [];
  }

  const { nodes, edges, outgoing } = buildGraph(pieces);
  const cycles: Point[][] = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) continue;
    const ids = traceFace(i, nodes, edges, outgoing);
    if (ids.length < 3) continue;
    const pts = ids.map(id => nodes[id]);
    if (Math.abs(signedArea(pts)) > 1e-9) cycles.push(closeLoop(pts));
  }

  return cycles.filter(loop => {
    if (loop.length < 3) return false;

    const area = signedArea(loop);
    // traceFace with rightmost turns extracts faces CCW (positive area).
    // The infinite "exterior" face will be traced CW (negative area).
    if (area < 1e-9) return false;

    // To verify if this CCW loop is a valid offset, we check if a point
    // just inside it satisfies the offset condition.
    const p1 = loop[0];
    const p2 = loop[1];
    const v = normalize(sub(p2, p1));
    const n = { x: -v.y, y: v.x }; // Left normal (pointing inside the CCW loop)
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    const testPt = add(mid, mul(n, 0.01));
    const inside = pointInPolygon(testPt, src);

    if (offset > 0) {
        if (inside) return false;
    } else {
        if (!inside) return false;
        // Strict distance check for inward offsets to prevent cross-overs
        // Each point on the offset path must be at least |offset| away from boundary
        const d = minDistanceToPolyline(mid, src);
        if (d < Math.abs(offset) - 1e-4) return false;
    }

    return true;
  });
}

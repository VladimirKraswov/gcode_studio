// src/geometry/offset.ts
import type { JoinType, Point } from "../types";

const EPS = 1e-6;
const ROUND_ARC_STEPS_PER_90 = 6;
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
  return Number(value.toFixed(3));
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
  if (l <= EPS) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x);
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
    const q = rp(p);
    const last = out[out.length - 1];
    if (!last || !eq(last, q)) out.push(q);
  }
  if (out.length > 1 && eq(out[0], out[out.length - 1])) out.pop();
  return out;
}

function normalizeClosedPolyline(points: Point[]): Point[] {
  const clean = dedupeSequential(points);
  if (clean.length < 3) return clean;
  if (eq(clean[0], clean[clean.length - 1])) return clean.slice(0, -1);
  return clean;
}

function closeLoop(points: Point[]): Point[] {
  const clean = dedupeSequential(points);
  if (clean.length < 3) return clean;
  if (!eq(clean[0], clean[clean.length - 1])) return [...clean, rp(clean[0])];
  return clean;
}

function inwardNormal(a: Point, b: Point, clockwise: boolean): Vec2 {
  const d = normalize(sub(b, a));
  return clockwise ? { x: d.y, y: -d.x } : { x: -d.y, y: d.x };
}

function lineIntersection(
  p: Point,
  r: Vec2,
  q: Point,
  s: Vec2
): { point: Point; t: number; u: number } | null {
  const rxs = cross(r, s);
  const qmp = sub(q, p);
  if (Math.abs(rxs) <= EPS) return null;

  const t = cross(qmp, s) / rxs;
  const u = cross(qmp, r) / rxs;

  return {
    point: rp({ x: p.x + r.x * t, y: p.y + r.y * t }),
    t,
    u,
  };
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

  if (hit.t < -EPS || hit.t > 1 + EPS || hit.u < -EPS || hit.u > 1 + EPS) return null;
  return { point: hit.point, ta: hit.t, tb: hit.u };
}

function pointLineDistance(p: Point, a: Point, b: Point): number {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const L = len(ab);
  if (L <= EPS) return dist(p, a);
  return Math.abs(cross(ap, ab)) / L;
}

function appendPoint(out: Point[], p: Point): void {
  const q = rp(p);
  const last = out[out.length - 1];
  if (!last || !eq(last, q)) out.push(q);
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

  if (ccw) {
    while (a1 <= a0) a1 += Math.PI * 2;
  } else {
    while (a1 >= a0) a1 -= Math.PI * 2;
  }

  const sweep = a1 - a0;
  const quarterTurns = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)));
  const segments = quarterTurns * ROUND_ARC_STEPS_PER_90;

  for (let i = 1; i <= segments; i++) {
    const t = a0 + (sweep * i) / segments;
    appendPoint(out, {
      x: center.x + radius * Math.cos(t),
      y: center.y + radius * Math.sin(t),
    });
  }
}

function clipMiter(
  corner: Point,
  intersection: Point,
  offsetAbs: number,
  miterLimit: number,
  fallback: Point
): Point {
  const miterLen = dist(corner, intersection);
  if (offsetAbs <= EPS) return fallback;
  if (miterLen / offsetAbs > miterLimit) return fallback;
  return intersection;
}

function rawOffsetLoop(
  polyline: Point[],
  offset: number,
  joinType: JoinType,
  miterLimit: number
): Point[] {
  const base = normalizeClosedPolyline(polyline);
  if (base.length < 3 || Math.abs(offset) <= EPS) return [];

  const clockwise = isClockwise(base);
  const signedOffset = -offset;
  const offsetAbs = Math.abs(signedOffset);
  const n = base.length;
  const out: Point[] = [];

  for (let i = 0; i < n; i++) {
    const prev = base[(i - 1 + n) % n];
    const curr = base[i];
    const next = base[(i + 1) % n];

    const prevDir = normalize(sub(curr, prev));
    const nextDir = normalize(sub(next, curr));
    if (len(prevDir) <= EPS || len(nextDir) <= EPS) continue;

    const n1 = inwardNormal(prev, curr, clockwise);
    const n2 = inwardNormal(curr, next, clockwise);

    const s1p = add(curr, mul(n1, signedOffset));
    const s2p = add(curr, mul(n2, signedOffset));

    const hit = lineIntersection(s1p, prevDir, s2p, nextDir);
    const p1 = rp(s1p);
    const p2 = rp(s2p);

    const turn = cross(prevDir, nextDir);
    const convex = clockwise ? turn < 0 : turn > 0;

    if (Math.abs(turn) <= EPS) {
      appendPoint(out, p2);
      continue;
    }

    if (joinType === "miter" && hit && convex) {
      const fallback = rp({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
      appendPoint(out, clipMiter(curr, hit.point, offsetAbs, miterLimit, fallback));
      continue;
    }

    if (joinType === "round" && convex) {
      appendPoint(out, p1);
      const a0 = Math.atan2(p1.y - curr.y, p1.x - curr.x);
      const a1 = Math.atan2(p2.y - curr.y, p2.x - curr.x);
      const ccw = !clockwise;
      appendArc(out, curr, offsetAbs, a0, a1, ccw);
      continue;
    }

    if (hit) appendPoint(out, hit.point);
    else appendPoint(out, p2);
  }

  return closeLoop(out);
}

function splitSegmentsAtIntersections(loop: Point[]): Segment[] {
  const closed = closeLoop(loop);
  if (closed.length < 4) return [];

  const baseSegments: Segment[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const a = closed[i];
    const b = closed[i + 1];
    if (!eq(a, b)) baseSegments.push({ a, b });
  }

  const cuts: number[][] = baseSegments.map(() => [0, 1]);

  for (let i = 0; i < baseSegments.length; i++) {
    for (let j = i + 1; j < baseSegments.length; j++) {
      const si = baseSegments[i];
      const sj = baseSegments[j];
      const adjacent = j === i + 1 || (i === 0 && j === baseSegments.length - 1);
      if (adjacent) continue;

      const hit = segmentIntersection(si.a, si.b, sj.a, sj.b);
      if (!hit) continue;
      if (hit.ta > EPS && hit.ta < 1 - EPS) cuts[i].push(hit.ta);
      if (hit.tb > EPS && hit.tb < 1 - EPS) cuts[j].push(hit.tb);
    }
  }

  const out: Segment[] = [];
  for (let i = 0; i < baseSegments.length; i++) {
    const seg = baseSegments[i];
    const ts = Array.from(new Set(cuts[i].map((v) => round(v)))).sort((a, b) => a - b);
    const d = sub(seg.b, seg.a);

    for (let k = 0; k < ts.length - 1; k++) {
      const t0 = ts[k];
      const t1 = ts[k + 1];
      if (t1 - t0 <= EPS) continue;

      const a = rp({ x: seg.a.x + d.x * t0, y: seg.a.y + d.y * t0 });
      const b = rp({ x: seg.a.x + d.x * t1, y: seg.a.y + d.y * t1 });
      if (!eq(a, b)) out.push({ a, b });
    }
  }

  return out;
}

function keyOfPoint(p: Point): string {
  return `${round(p.x)}:${round(p.y)}`;
}

function buildGraph(segments: Segment[]): { nodes: Node[]; edges: DirectedEdge[]; outgoing: number[][] } {
  const nodeMap = new Map<string, number>();
  const nodes: Node[] = [];

  const getNodeId = (p: Point): number => {
    const key = keyOfPoint(p);
    const found = nodeMap.get(key);
    if (found != null) return found;
    const id = nodes.length;
    nodes.push(rp(p));
    nodeMap.set(key, id);
    return id;
  };

  const edges: DirectedEdge[] = [];

  for (const s of segments) {
    const a = getNodeId(s.a);
    const b = getNodeId(s.b);
    if (a === b) continue;

    const ab = sub(nodes[b], nodes[a]);
    const ba = sub(nodes[a], nodes[b]);
    edges.push({ from: a, to: b, angle: angleOf(ab), used: false });
    edges.push({ from: b, to: a, angle: angleOf(ba), used: false });
  }

  const outgoing: number[][] = Array.from({ length: nodes.length }, () => []);
  for (let i = 0; i < edges.length; i++) outgoing[edges[i].from].push(i);
  for (const arr of outgoing) arr.sort((ia, ib) => edges[ia].angle - edges[ib].angle);

  return { nodes, edges, outgoing };
}

function angleDeltaCW(fromAngle: number, toAngle: number): number {
  let d = fromAngle - toAngle;
  while (d < 0) d += Math.PI * 2;
  while (d >= Math.PI * 2) d -= Math.PI * 2;
  return d;
}

function traceFace(
  startEdgeIdx: number,
  nodes: Node[],
  edges: DirectedEdge[],
  outgoing: number[][]
): number[] {
  const cycle: number[] = [];
  let currentEdgeIdx = startEdgeIdx;

  while (true) {
    const e = edges[currentEdgeIdx];
    if (e.used) break;

    e.used = true;
    cycle.push(e.from);

    const arrivalAngle = angleOf(sub(nodes[e.from], nodes[e.to]));
    const outs = outgoing[e.to];
    if (outs.length === 0) break;

    let bestIdx = -1;
    let bestTurn = Infinity;

    for (const candIdx of outs) {
      const cand = edges[candIdx];
      if (cand.used) continue;
      const turn = angleDeltaCW(arrivalAngle, cand.angle);
      if (turn < bestTurn) {
        bestTurn = turn;
        bestIdx = candIdx;
      }
    }

    if (bestIdx === -1) break;
    currentEdgeIdx = bestIdx;

    if (currentEdgeIdx === startEdgeIdx) {
      cycle.push(edges[currentEdgeIdx].from);
      break;
    }
  }

  return cycle;
}

function simplifyCollinear(points: Point[]): Point[] {
  const closed = closeLoop(points);
  if (closed.length < 4) return closed;

  const open = closed.slice(0, -1);
  const out: Point[] = [];

  for (let i = 0; i < open.length; i++) {
    const prev = open[(i - 1 + open.length) % open.length];
    const curr = open[i];
    const next = open[(i + 1) % open.length];
    if (pointLineDistance(curr, prev, next) <= EPS) continue;
    out.push(curr);
  }

  return closeLoop(out);
}

function extractSimpleLoops(loop: Point[]): Point[][] {
  const pieces = splitSegmentsAtIntersections(loop);
  if (pieces.length === 0) return [];

  const { nodes, edges, outgoing } = buildGraph(pieces);
  const cycles: Point[][] = [];

  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) continue;
    const cycleNodeIds = traceFace(i, nodes, edges, outgoing);
    if (cycleNodeIds.length < 4) continue;

    const pts = cycleNodeIds.map((id) => nodes[id]);
    const clean = simplifyCollinear(pts);
    if (clean.length >= 4 && Math.abs(signedArea(clean.slice(0, -1))) > EPS) cycles.push(clean);
  }

  const unique = new Map<string, Point[]>();
  for (const c of cycles) {
    const open = c.slice(0, -1);
    const canon = open.map((p) => `${round(p.x)},${round(p.y)}`).sort().join("|");
    if (!unique.has(canon)) unique.set(canon, c);
  }

  return Array.from(unique.values()).sort(
    (a, b) => Math.abs(signedArea(b.slice(0, -1))) - Math.abs(signedArea(a.slice(0, -1)))
  );
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const poly = closeLoop(polygon);
  let inside = false;

  for (let i = 0, j = poly.length - 2; i < poly.length - 1; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || EPS) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function centroid(points: Point[]): Point {
  const poly = closeLoop(points);
  let cx = 0;
  let cy = 0;
  let a = 0;

  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i];
    const q = poly[i + 1];
    const f = p.x * q.y - q.x * p.y;
    a += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }

  a *= 0.5;
  if (Math.abs(a) <= EPS) {
    const sum = poly.slice(0, -1).reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    const n = Math.max(1, poly.length - 1);
    return { x: sum.x / n, y: sum.y / n };
  }

  return { x: cx / (6 * a), y: cy / (6 * a) };
}

export function buildOffset(
  polyline: Point[],
  offset: number,
  joinType: JoinType = "round",
  miterLimit = DEFAULT_MITER_LIMIT
): Point[][] {
  const raw = rawOffsetLoop(polyline, offset, joinType, miterLimit);
  if (raw.length < 4) return [];

  const loops = extractSimpleLoops(raw);
  if (loops.length === 0) return [];

  const src = closeLoop(normalizeClosedPolyline(polyline));
  const filtered = loops.filter((loop) => {
    const c = centroid(loop);
    if (offset < 0) return pointInPolygon(c, src);
    return true;
  });

  return filtered.length > 0 ? filtered : loops;
}

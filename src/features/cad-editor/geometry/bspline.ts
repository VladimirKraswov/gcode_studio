import type { SketchBSpline, SketchPoint } from "../model/types";

export type CadPoint = {
  x: number;
  y: number;
};

const EPS = 1e-9;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildPointMap(points: SketchPoint[]): Map<string, SketchPoint> {
  return new Map(points.map((p) => [p.id, p]));
}

export function getBSplineControlPoints(
  shape: SketchBSpline,
  points: SketchPoint[],
): CadPoint[] {
  const pointMap = buildPointMap(points);
  return shape.controlPointIds
    .map((id) => pointMap.get(id))
    .filter((p): p is SketchPoint => !!p)
    .map((p) => ({ x: p.x, y: p.y }));
}

function buildOpenUniformKnotVector(controlCount: number, degree: number): number[] {
  const n = controlCount - 1;
  const p = degree;
  const m = n + p + 1;
  const knots: number[] = [];

  for (let i = 0; i <= m; i += 1) {
    if (i <= p) {
      knots.push(0);
    } else if (i >= m - p) {
      knots.push(1);
    } else {
      knots.push((i - p) / (m - 2 * p));
    }
  }

  return knots;
}

function buildPeriodicUniformKnotVector(controlCount: number, degree: number): number[] {
  const total = controlCount + degree + 1;
  const knots: number[] = [];
  const max = total - 1;

  for (let i = 0; i < total; i += 1) {
    knots.push(i / max);
  }

  return knots;
}

function findSpan(n: number, degree: number, u: number, knots: number[]): number {
  if (u >= knots[n + 1] - EPS) return n;
  if (u <= knots[degree] + EPS) return degree;

  let low = degree;
  let high = n + 1;
  let mid = Math.floor((low + high) / 2);

  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid;
    else low = mid;
    mid = Math.floor((low + high) / 2);
  }

  return mid;
}

function deBoor(
  degree: number,
  knots: number[],
  controlPoints: CadPoint[],
  u: number,
): CadPoint {
  const n = controlPoints.length - 1;
  const k = findSpan(n, degree, u, knots);
  const d: CadPoint[] = [];

  for (let j = 0; j <= degree; j += 1) {
    const idx = k - degree + j;
    const p = controlPoints[clamp(idx, 0, n)];
    d.push({ x: p.x, y: p.y });
  }

  for (let r = 1; r <= degree; r += 1) {
    for (let j = degree; j >= r; j -= 1) {
      const i = k - degree + j;
      const denom = knots[i + degree + 1 - r] - knots[i];
      const alpha = Math.abs(denom) <= EPS ? 0 : (u - knots[i]) / denom;

      d[j] = {
        x: (1 - alpha) * d[j - 1].x + alpha * d[j].x,
        y: (1 - alpha) * d[j - 1].y + alpha * d[j].y,
      };
    }
  }

  return {
    x: d[degree].x,
    y: d[degree].y,
  };
}

function preparePeriodicControlPoints(points: CadPoint[], degree: number): CadPoint[] {
  if (points.length === 0) return [];
  const extra = Math.min(degree, points.length);
  return [...points, ...points.slice(0, extra)];
}

export function sampleBSpline(
  shape: SketchBSpline,
  points: SketchPoint[],
  samples = 96,
): CadPoint[] {
  const base = getBSplineControlPoints(shape, points);
  if (base.length < 2) return base;
  if (base.length === 2) return base;

  const degree = Math.max(1, Math.min(shape.degree ?? 3, base.length - 1));
  const periodic = !!shape.periodic;

  const controlPoints = periodic
    ? preparePeriodicControlPoints(base, degree)
    : base;

  if (controlPoints.length <= degree) {
    return base;
  }

  const knots = periodic
    ? buildPeriodicUniformKnotVector(controlPoints.length, degree)
    : buildOpenUniformKnotVector(controlPoints.length, degree);

  const domainStart = periodic ? knots[degree] : 0;
  const domainEnd = periodic ? knots[controlPoints.length] : 1;

  const result: CadPoint[] = [];
  const count = Math.max(samples, controlPoints.length * 12);

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const u = domainStart + (domainEnd - domainStart) * t;
    result.push(deBoor(degree, knots, controlPoints, u));
  }

  if (periodic && result.length > 1) {
    result[result.length - 1] = { ...result[0] };
  }

  return dedupeSequential(result);
}

function dedupeSequential(points: CadPoint[]): CadPoint[] {
  const out: CadPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 1e-6) {
      out.push(p);
    }
    // If it's the last point and it's too close to the previous one,
    // it's skipped to avoid redundant zero-length segments, which is
    // safe because closure is handled by the caller/sampler ensuring
    // the first and last points are identical if needed.
  }

  return out;
}
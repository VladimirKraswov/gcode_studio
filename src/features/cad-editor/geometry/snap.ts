import type {
  SketchPolylinePoint,
  SketchShape,
  SketchPoint,
  SketchLine,
  SketchCircle,
  SketchArc,
  SketchPolyline,
  SketchBSpline,
} from "../model/types";
import { distance } from "./distance";
import { sampleBSpline } from "./bspline";

export type SnapOptions = {
  gridStep?: number;
  tolerance?: number;
  shapes?: SketchShape[];
  points?: SketchPoint[];
};

export type SnapKind =
  | "none"
  | "endpoint"
  | "midpoint"
  | "intersection"
  | "point-on-object"
  | "grid";

export type SnapResult = {
  point: SketchPolylinePoint;
  kind: SnapKind;
  pointId?: string;
  shapeId?: string;
  relatedPointIds?: string[];
  relatedShapeIds?: string[];
};

const EPS = 1e-6;

function roundPoint(point: SketchPolylinePoint): SketchPolylinePoint {
  return {
    x: Number(point.x.toFixed(3)),
    y: Number(point.y.toFixed(3)),
  };
}

function sqr(value: number): number {
  return value * value;
}

function pointToSegmentProjection(
  point: SketchPolylinePoint,
  a: SketchPolylinePoint,
  b: SketchPolylinePoint,
): { point: SketchPolylinePoint; t: number; distance: number } {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const ab2 = abx * abx + aby * aby;

  if (ab2 <= EPS) {
    const p = { x: a.x, y: a.y };
    return {
      point: p,
      t: 0,
      distance: distance(point, p),
    };
  }

  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));

  const projected = {
    x: a.x + abx * t,
    y: a.y + aby * t,
  };

  return {
    point: roundPoint(projected),
    t,
    distance: distance(point, projected),
  };
}

function lineLineIntersection(
  a1: SketchPolylinePoint,
  a2: SketchPolylinePoint,
  b1: SketchPolylinePoint,
  b2: SketchPolylinePoint,
): SketchPolylinePoint | null {
  const x1 = a1.x;
  const y1 = a1.y;
  const x2 = a2.x;
  const y2 = a2.y;
  const x3 = b1.x;
  const y3 = b1.y;
  const x4 = b2.x;
  const y4 = b2.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) <= EPS) return null;

  const px =
    ((x1 * y2 - y1 * x2) * (x3 - x4) -
      (x1 - x2) * (x3 * y4 - y3 * x4)) /
    denom;
  const py =
    ((x1 * y2 - y1 * x2) * (y3 - y4) -
      (y1 - y2) * (x3 * y4 - y3 * x4)) /
    denom;

  const withinA =
    px >= Math.min(x1, x2) - EPS &&
    px <= Math.max(x1, x2) + EPS &&
    py >= Math.min(y1, y2) - EPS &&
    py <= Math.max(y1, y2) + EPS;

  const withinB =
    px >= Math.min(x3, x4) - EPS &&
    px <= Math.max(x3, x4) + EPS &&
    py >= Math.min(y3, y4) - EPS &&
    py <= Math.max(y3, y4) + EPS;

  if (!withinA || !withinB) return null;
  return roundPoint({ x: px, y: py });
}

function getPointMap(points: SketchPoint[]) {
  return new Map(points.map((point) => [point.id, point]));
}

function getShapePointIds(shape: SketchShape): string[] {
  const anyShape = shape as any;
  const ids: string[] = [];

  if (anyShape.p1) ids.push(anyShape.p1);
  if (anyShape.p2) ids.push(anyShape.p2);
  if (anyShape.center) ids.push(anyShape.center);
  if (anyShape.majorAxisPoint) ids.push(anyShape.majorAxisPoint);
  if (Array.isArray(anyShape.pointIds)) ids.push(...anyShape.pointIds);
  if (Array.isArray(anyShape.controlPointIds)) ids.push(...anyShape.controlPointIds);

  return ids;
}

function getLineSegments(
  shape: SketchShape,
  points: SketchPoint[],
): Array<{
  a: SketchPolylinePoint;
  b: SketchPolylinePoint;
  pointIds: string[];
  shapeId: string;
}> {
  const pointMap = getPointMap(points);

  switch (shape.type) {
    case "line": {
      const line = shape as SketchLine;
      const p1 = pointMap.get(line.p1);
      const p2 = pointMap.get(line.p2);
      if (!p1 || !p2) return [];
      return [{ a: p1, b: p2, pointIds: [line.p1, line.p2], shapeId: shape.id }];
    }

    case "polyline": {
      const polyline = shape as SketchPolyline;
      const result: Array<{
        a: SketchPolylinePoint;
        b: SketchPolylinePoint;
        pointIds: string[];
        shapeId: string;
      }> = [];

      for (let i = 1; i < polyline.pointIds.length; i += 1) {
        const p1 = pointMap.get(polyline.pointIds[i - 1]);
        const p2 = pointMap.get(polyline.pointIds[i]);
        if (!p1 || !p2) continue;
        result.push({
          a: p1,
          b: p2,
          pointIds: [polyline.pointIds[i - 1], polyline.pointIds[i]],
          shapeId: shape.id,
        });
      }

      return result;
    }

    case "bspline": {
      const spline = shape as SketchBSpline;
      const sampled = sampleBSpline(spline, points, 64);
      const result: Array<{
        a: SketchPolylinePoint;
        b: SketchPolylinePoint;
        pointIds: string[];
        shapeId: string;
      }> = [];

      for (let i = 1; i < sampled.length; i += 1) {
        result.push({
          a: sampled[i - 1],
          b: sampled[i],
          pointIds: [],
          shapeId: shape.id,
        });
      }

      return result;
    }

    default:
      return [];
  }
}

function snapToGrid(point: SketchPolylinePoint, gridStep = 10): SnapResult {
  return {
    point: {
      x: Math.round(point.x / gridStep) * gridStep,
      y: Math.round(point.y / gridStep) * gridStep,
    },
    kind: "grid",
  };
}

function snapToEndpoints(
  point: SketchPolylinePoint,
  allPoints: SketchPoint[],
  tolerance = 4,
): SnapResult | null {
  let best: SketchPoint | null = null;
  let bestDistance = Infinity;

  for (const candidate of allPoints) {
    const d = distance(point, candidate);
    if (d <= tolerance && d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }

  if (!best) return null;

  return {
    point: { x: best.x, y: best.y },
    kind: "endpoint",
    pointId: best.id,
  };
}

function snapToMidpoints(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  points: SketchPoint[],
  tolerance = 4,
): SnapResult | null {
  let best: SnapResult | null = null;
  let bestDistance = Infinity;

  for (const shape of shapes) {
    const segments = getLineSegments(shape, points);

    for (const segment of segments) {
      if (segment.pointIds.length < 2) continue;

      const midpoint = {
        x: (segment.a.x + segment.b.x) / 2,
        y: (segment.a.y + segment.b.y) / 2,
      };

      const d = distance(point, midpoint);
      if (d <= tolerance && d < bestDistance) {
        bestDistance = d;
        best = {
          point: roundPoint(midpoint),
          kind: "midpoint",
          shapeId: shape.id,
          relatedPointIds: [...segment.pointIds],
          relatedShapeIds: [shape.id],
        };
      }
    }
  }

  return best;
}

function snapToIntersections(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  points: SketchPoint[],
  tolerance = 4,
): SnapResult | null {
  const segments = shapes.flatMap((shape) => getLineSegments(shape, points));
  let best: SnapResult | null = null;
  let bestDistance = Infinity;

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];

      if (a.shapeId === b.shapeId) continue;

      const hit = lineLineIntersection(a.a, a.b, b.a, b.b);
      if (!hit) continue;

      const d = distance(point, hit);
      if (d <= tolerance && d < bestDistance) {
        bestDistance = d;
        best = {
          point: hit,
          kind: "intersection",
          relatedShapeIds: [a.shapeId, b.shapeId],
        };
      }
    }
  }

  return best;
}

function snapToLineLikeObjects(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  points: SketchPoint[],
  tolerance = 4,
): SnapResult | null {
  let best: SnapResult | null = null;
  let bestDistance = Infinity;

  for (const shape of shapes) {
    const segments = getLineSegments(shape, points);

    for (const segment of segments) {
      const projected = pointToSegmentProjection(point, segment.a, segment.b);
      if (projected.distance <= tolerance && projected.distance < bestDistance) {
        bestDistance = projected.distance;
        best = {
          point: projected.point,
          kind: "point-on-object",
          shapeId: shape.id,
          relatedPointIds: segment.pointIds,
          relatedShapeIds: [shape.id],
        };
      }
    }
  }

  return best;
}

function snapToCircleLikeObjects(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  points: SketchPoint[],
  tolerance = 4,
): SnapResult | null {
  const pointMap = getPointMap(points);
  let best: SnapResult | null = null;
  let bestDistance = Infinity;

  for (const shape of shapes) {
    if (shape.type !== "circle" && shape.type !== "arc") continue;

    const circle = shape as SketchCircle | SketchArc;
    const center = pointMap.get(circle.center);
    if (!center) continue;

    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len <= EPS) continue;

    const projected = {
      x: center.x + (dx / len) * circle.radius,
      y: center.y + (dy / len) * circle.radius,
    };

    const d = distance(point, projected);
    if (d <= tolerance && d < bestDistance) {
      bestDistance = d;
      best = {
        point: roundPoint(projected),
        kind: "point-on-object",
        shapeId: shape.id,
        relatedShapeIds: [shape.id],
      };
    }
  }

  return best;
}

export function resolveSnap(
  point: SketchPolylinePoint,
  options: SnapOptions = {},
): SnapResult {
  const {
    gridStep = 1,
    tolerance = 4,
    points = [],
    shapes = [],
  } = options;

  const endpoint = snapToEndpoints(point, points, tolerance);
  if (endpoint) return endpoint;

  const midpoint = snapToMidpoints(point, shapes, points, tolerance);
  if (midpoint) return midpoint;

  const intersection = snapToIntersections(point, shapes, points, tolerance);
  if (intersection) return intersection;

  const onLineLike = snapToLineLikeObjects(point, shapes, points, tolerance);
  if (onLineLike) return onLineLike;

  const onCircleLike = snapToCircleLikeObjects(point, shapes, points, tolerance);
  if (onCircleLike) return onCircleLike;

  return snapToGrid(point, gridStep);
}

export function applyDefaultSnap(
  point: SketchPolylinePoint,
  options: SnapOptions = {},
): SketchPolylinePoint {
  return resolveSnap(point, options).point;
}

export function snapToGridLegacy(point: SketchPolylinePoint, gridStep = 10): SketchPolylinePoint {
  return snapToGrid(point, gridStep).point;
}
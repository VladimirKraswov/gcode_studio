import type { SketchBSpline, SketchPoint } from "../model/types";
import { createPoint } from "../model/shapeFactory";

type Point2D = {
  x: number;
  y: number;
};

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointToSegmentDistance(point: Point2D, start: Point2D, end: Point2D): number {
  const abx = end.x - start.x;
  const aby = end.y - start.y;
  const apx = point.x - start.x;
  const apy = point.y - start.y;
  const ab2 = abx * abx + aby * aby;

  if (ab2 <= 1e-9) return distance(point, start);

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const proj = {
    x: start.x + abx * t,
    y: start.y + aby * t,
  };

  return distance(point, proj);
}

function projectPointToSegment(point: Point2D, start: Point2D, end: Point2D): Point2D {
  const abx = end.x - start.x;
  const aby = end.y - start.y;
  const apx = point.x - start.x;
  const apy = point.y - start.y;
  const ab2 = abx * abx + aby * aby;

  if (ab2 <= 1e-9) {
    return { ...start };
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return {
    x: start.x + abx * t,
    y: start.y + aby * t,
  };
}

function getControlPoints(shape: SketchBSpline, points: SketchPoint[]) {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  return shape.controlPointIds
    .map((id) => pointMap.get(id))
    .filter((p): p is SketchPoint => !!p);
}

export function findBestBSplineInsertionIndex(
  shape: SketchBSpline,
  points: SketchPoint[],
  target: Point2D,
): { insertIndex: number; projected: Point2D } | null {
  const controlPoints = getControlPoints(shape, points);
  if (controlPoints.length < 2) return null;

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProjected: Point2D | null = null;

  const segmentCount = shape.periodic ? controlPoints.length : controlPoints.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const a = controlPoints[i];
    const b = controlPoints[(i + 1) % controlPoints.length];
    const d = pointToSegmentDistance(target, a, b);

    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i + 1;
      bestProjected = projectPointToSegment(target, a, b);
    }
  }

  if (bestIndex < 0 || !bestProjected) return null;
  return { insertIndex: bestIndex, projected: bestProjected };
}

export function insertBSplineControlPoint(
  shape: SketchBSpline,
  points: SketchPoint[],
  target: Point2D,
): { point: SketchPoint; nextControlPointIds: string[] } | null {
  const result = findBestBSplineInsertionIndex(shape, points, target);
  if (!result) return null;

  const point = createPoint(result.projected.x, result.projected.y);
  const nextControlPointIds = [...shape.controlPointIds];
  nextControlPointIds.splice(result.insertIndex, 0, point.id);

  return { point, nextControlPointIds };
}

export function removeBSplineControlPoint(
  shape: SketchBSpline,
  pointId: string,
): { nextControlPointIds: string[]; nextDegree: number } | null {
  if (!shape.controlPointIds.includes(pointId)) return null;

  const minRequired = shape.periodic ? 3 : 2;
  if (shape.controlPointIds.length <= minRequired) return null;

  const nextControlPointIds = shape.controlPointIds.filter((id) => id !== pointId);
  const nextDegree = Math.max(1, Math.min(shape.degree, nextControlPointIds.length - 1));

  return {
    nextControlPointIds,
    nextDegree,
  };
}
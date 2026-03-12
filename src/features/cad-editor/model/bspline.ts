import { type SketchBSpline, type SketchPoint, type SketchShape } from "./types";

/**
 * Calculates a suitable insertion point (centroid of control points) for a new control point in a B-spline.
 */
export function calculateBSplineInsertionPoint(
  shape: SketchShape,
  points: SketchPoint[]
): { x: number; y: number } | null {
  if (shape.type !== "bspline") return null;
  const bspline = shape as SketchBSpline;

  const pointMap = new Map(points.map((p) => [p.id, p]));

  const controlPoints = bspline.controlPointIds
    .map((id) => pointMap.get(id))
    .filter((p): p is SketchPoint => Boolean(p));

  if (controlPoints.length < 2) return null;

  let cx = 0;
  let cy = 0;

  controlPoints.forEach((p) => {
    cx += p.x;
    cy += p.y;
  });

  return {
    x: cx / controlPoints.length,
    y: cy / controlPoints.length,
  };
}

import type { SketchPolylinePoint, SketchShape, SketchPoint } from "../model/types";
import { distance } from "./distance";

export type SnapOptions = {
  gridStep?: number;
  tolerance?: number;
  shapes?: SketchShape[];
  points?: SketchPoint[];
};

export function snapToGrid(point: SketchPolylinePoint, gridStep = 10): SketchPolylinePoint {
  return {
    x: Math.round(point.x / gridStep) * gridStep,
    y: Math.round(point.y / gridStep) * gridStep,
  };
}

export function snapToEndpoints(point: SketchPolylinePoint, allPoints: SketchPoint[], tolerance = 4): SketchPolylinePoint {
  let best = point;
  let bestDistance = Infinity;
  for (const candidate of allPoints) {
    const d = distance(point, candidate);
    if (d <= tolerance && d < bestDistance) {
      best = { x: candidate.x, y: candidate.y };
      bestDistance = d;
    }
  }
  return best;
}

export function snapToMidpoints(point: SketchPolylinePoint) {
  return point;
}

export function snapToIntersections(point: SketchPolylinePoint) {
  return point;
}

export function applyDefaultSnap(point: SketchPolylinePoint, options: SnapOptions = {}) {
  const { gridStep = 1, tolerance = 4, points = [] } = options;
  const endpointSnapped = snapToEndpoints(point, points, tolerance);
  if (endpointSnapped !== point) {
    return endpointSnapped;
  }
  return snapToGrid(point, gridStep);
}

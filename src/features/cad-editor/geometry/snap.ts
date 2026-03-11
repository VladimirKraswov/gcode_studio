import type { SketchPolylinePoint, SketchShape } from "../model/types";
import { distance } from "./distance";

export type SnapOptions = {
  gridStep?: number;
  tolerance?: number;
  shapes?: SketchShape[];
};

export function snapToGrid(point: SketchPolylinePoint, gridStep = 10): SketchPolylinePoint {
  return {
    x: Math.round(point.x / gridStep) * gridStep,
    y: Math.round(point.y / gridStep) * gridStep,
  };
}

export function snapToEndpoints(point: SketchPolylinePoint, shapes: SketchShape[], tolerance = 4): SketchPolylinePoint {
  const candidates: SketchPolylinePoint[] = [];
  for (const shape of shapes) {
    if (shape.type === "polyline") {
      candidates.push(...shape.points);
    }
  }
  let best = point;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const d = distance(point, candidate);
    if (d <= tolerance && d < bestDistance) {
      best = candidate;
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
  const { gridStep = 1, tolerance = 4, shapes = [] } = options;
  const endpointSnapped = snapToEndpoints(point, shapes, tolerance);
  if (endpointSnapped !== point) {
    return endpointSnapped;
  }
  return snapToGrid(point, gridStep);
}

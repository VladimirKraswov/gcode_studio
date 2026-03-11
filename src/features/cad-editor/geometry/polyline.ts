import type { SketchPolylinePoint } from "../model/types";

export function isClosedPolyline(points: SketchPolylinePoint[]): boolean {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return Math.abs(first.x - last.x) < 0.001 && Math.abs(first.y - last.y) < 0.001;
}
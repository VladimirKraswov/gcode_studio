import type { SketchPolylinePoint, SketchShape } from "../model/types";
import { distance } from "./distance";
import { shapeBounds } from "../model/shapeBounds";

function pointToSegmentDistance(point: SketchPolylinePoint, a: SketchPolylinePoint, b: SketchPolylinePoint): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return distance(point, a);
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return distance(point, { x: a.x + abx * t, y: a.y + aby * t });
}

export function hitTestShape(point: SketchPolylinePoint, shape: SketchShape, tolerance = 3): boolean {
  switch (shape.type) {
    case "rectangle":
      return (
        point.x >= shape.x - tolerance &&
        point.x <= shape.x + shape.width + tolerance &&
        point.y >= shape.y - tolerance &&
        point.y <= shape.y + shape.height + tolerance
      );
    case "circle":
      return distance(point, { x: shape.cx, y: shape.cy }) <= shape.radius + tolerance;
    case "polyline":
      for (let i = 1; i < shape.points.length; i += 1) {
        if (pointToSegmentDistance(point, shape.points[i - 1], shape.points[i]) <= tolerance) {
          return true;
        }
      }
      return false;
    case "text": {
      const bounds = shapeBounds(shape);
      return (
        point.x >= bounds.minX - tolerance &&
        point.x <= bounds.maxX + tolerance &&
        point.y >= bounds.minY - tolerance &&
        point.y <= bounds.maxY + tolerance
      );
    }
  }
}

export function hitTestShapes(point: SketchPolylinePoint, shapes: SketchShape[], tolerance = 3): SketchShape | null {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    if (hitTestShape(point, shapes[i], tolerance)) {
      return shapes[i];
    }
  }
  return null;
}

export function hitTestHandles() {
  return null;
}
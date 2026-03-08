import type { SketchPolylinePoint, SketchShape } from "../model/types";
import {
  pointDistance,
  pointToArcDistance,
  pointToSegmentDistance,
} from "../../geometry/geometryEngine";
import { shapeBounds } from "../model/shapeBounds";

export function hitTestShape(
  point: SketchPolylinePoint,
  shape: SketchShape,
  tolerance = 3,
): boolean {
  switch (shape.type) {
    case "rectangle":
      return (
        point.x >= shape.x - tolerance &&
        point.x <= shape.x + shape.width + tolerance &&
        point.y >= shape.y - tolerance &&
        point.y <= shape.y + shape.height + tolerance
      );

    case "circle":
      return pointDistance(point, { x: shape.cx, y: shape.cy }) <= shape.radius + tolerance;

    case "line":
      return (
        pointToSegmentDistance(
          point,
          { x: shape.x1, y: shape.y1 },
          { x: shape.x2, y: shape.y2 },
        ) <= tolerance
      );

    case "arc":
      return (
        pointToArcDistance(
          point,
          { x: shape.cx, y: shape.cy },
          shape.radius,
          shape.startAngle,
          shape.endAngle,
          shape.clockwise,
        ) <= tolerance
      );

    case "polyline":
      for (let i = 1; i < shape.points.length; i += 1) {
        if (
          pointToSegmentDistance(point, shape.points[i - 1], shape.points[i]) <= tolerance
        ) {
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

    case "svg": {
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

export function hitTestShapes(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  tolerance = 3,
): SketchShape | null {
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
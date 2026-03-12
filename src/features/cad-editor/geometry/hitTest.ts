import type { SketchPolylinePoint, SketchShape, SketchPoint } from "../model/types";
import {
  pointDistance,
  pointToArcDistance,
  pointToSegmentDistance,
} from "@/features/cad-editor/geometry/geometryEngine";
import { shapeBounds } from "../model/shapeBounds";
import { sampleBSpline } from "../geometry/bspline";

export function hitTestShape(
  point: SketchPolylinePoint,
  shape: SketchShape,
  allPoints: SketchPoint[],
  tolerance = 3,
): boolean {
  const pointMap = new Map(allPoints.map(p => [p.id, p]));
  const getPoint = (id: string) => pointMap.get(id) || { x: 0, y: 0 };

  switch (shape.type) {
    case "rectangle": {
      const p1 = getPoint(shape.p1);
      const p2 = getPoint(shape.p2);

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];

      for (let i = 0; i < 4; i += 1) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        if (pointToSegmentDistance(point, a, b) <= tolerance) {
          return true;
        }
      }

      return false;
    }

    case "circle": {
      const center = getPoint(shape.center);
      return pointDistance(point, center) <= shape.radius + tolerance;
    }

    case "line": {
      const p1 = getPoint(shape.p1);
      const p2 = getPoint(shape.p2);
      return pointToSegmentDistance(point, p1, p2) <= tolerance;
    }

    case "arc": {
      const center = getPoint(shape.center);
      const p1 = getPoint(shape.p1);
      const p2 = getPoint(shape.p2);
      const startAngle = (Math.atan2(p1.y - center.y, p1.x - center.x) * 180) / Math.PI;
      const endAngle = (Math.atan2(p2.y - center.y, p2.x - center.x) * 180) / Math.PI;
      return (
        pointToArcDistance(
          point,
          center,
          shape.radius,
          startAngle,
          endAngle,
          shape.clockwise,
        ) <= tolerance
      );
    }

    case "polyline": {
      const polyPoints = shape.pointIds.map(getPoint);
      for (let i = 1; i < polyPoints.length; i += 1) {
        if (
          pointToSegmentDistance(point, polyPoints[i - 1], polyPoints[i]) <= tolerance
        ) {
          return true;
        }
      }
      return false;
    }

    case "text": {
      const bounds = shapeBounds(shape, allPoints);
      return (
        point.x >= bounds.minX - tolerance &&
        point.x <= bounds.maxX + tolerance &&
        point.y >= bounds.minY - tolerance &&
        point.y <= bounds.maxY + tolerance
      );
    }

    case "svg": {
      const bounds = shapeBounds(shape, allPoints);
      return (
        point.x >= bounds.minX - tolerance &&
        point.x <= bounds.maxX + tolerance &&
        point.y >= bounds.minY - tolerance &&
        point.y <= bounds.maxY + tolerance
      );
    }

    case "bspline": {
      const splinePoints = sampleBSpline(shape, allPoints, 120);
      for (let i = 1; i < splinePoints.length; i += 1) {
        if (pointToSegmentDistance(point, splinePoints[i - 1], splinePoints[i]) <= tolerance) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

export function hitTestShapes(
  point: SketchPolylinePoint,
  shapes: SketchShape[],
  allPoints: SketchPoint[],
  tolerance = 3,
): SketchShape | null {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    if (hitTestShape(point, shapes[i], allPoints, tolerance)) {
      return shapes[i];
    }
  }
  return null;
}

export function hitTestHandles() {
  return null;
}

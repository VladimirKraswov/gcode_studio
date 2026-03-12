import {
  boundsFromPoints,
  sampleArcPoints,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { SketchDocument, SketchShape, SketchPoint } from "./types";
import { sampleBSpline } from "@/features/cad-editor/geometry/bspline";

export type Bounds2D = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function shapeBounds(shape: SketchShape, points: SketchPoint[]): Bounds2D {
  const pointMap = new Map(points.map(p => [p.id, p]));
  const getPoint = (id: string) => pointMap.get(id) || { x: 0, y: 0 };

  switch (shape.type) {
    case "rectangle": {
      const p1 = getPoint(shape.p1);
      const p2 = getPoint(shape.p2);
      return {
        minX: Math.min(p1.x, p2.x),
        minY: Math.min(p1.y, p2.y),
        maxX: Math.max(p1.x, p2.x),
        maxY: Math.max(p1.y, p2.y),
      };
    }

    case "circle": {
      const center = getPoint(shape.center);
      return {
        minX: center.x - shape.radius,
        minY: center.y - shape.radius,
        maxX: center.x + shape.radius,
        maxY: center.y + shape.radius,
      };
    }

    case "line": {
      const p1 = getPoint(shape.p1);
      const p2 = getPoint(shape.p2);
      return boundsFromPoints([p1, p2]);
    }

    case "arc": {
      const center = getPoint(shape.center);
      const start = getPoint(shape.p1);
      const end = getPoint(shape.p2);
      const startAngle = (Math.atan2(start.y - center.y, start.x - center.x) * 180) / Math.PI;
      const endAngle = (Math.atan2(end.y - center.y, end.x - center.x) * 180) / Math.PI;

      const pts = sampleArcPoints(
        center,
        shape.radius,
        startAngle,
        endAngle,
        shape.clockwise,
        72,
      );

      return boundsFromPoints(pts);
    }

    case "ellipse": {
      const center = getPoint(shape.center);
      const major = getPoint(shape.majorAxisPoint);
      const dist = Math.sqrt((major.x - center.x) ** 2 + (major.y - center.y) ** 2);
      const maxRadius = Math.max(dist, shape.minorAxisRadius);
      return {
        minX: center.x - maxRadius,
        minY: center.y - maxRadius,
        maxX: center.x + maxRadius,
        maxY: center.y + maxRadius,
      };
    }

    case "ellipse-arc": {
      const center = getPoint(shape.center);
      const major = getPoint(shape.majorAxisPoint);
      const dist = Math.sqrt((major.x - center.x) ** 2 + (major.y - center.y) ** 2);
      const maxRadius = Math.max(dist, shape.minorAxisRadius);
      return {
        minX: center.x - maxRadius,
        minY: center.y - maxRadius,
        maxX: center.x + maxRadius,
        maxY: center.y + maxRadius,
      };
    }

    case "polyline":
      return boundsFromPoints(shape.pointIds.map(getPoint));

    case "bspline": {
      const sampled = sampleBSpline(shape, points, 120);
      return boundsFromPoints(sampled.length > 0 ? sampled : shape.controlPointIds.map(getPoint));
    }

    case "text":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + 50 * (shape.scale ?? 1),
        maxY: shape.y + 10 * (shape.scale ?? 1)
      };

    case "svg":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width * (shape.scale ?? 1),
        maxY: shape.y + shape.height * (shape.scale ?? 1)
      };

    default:
      return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  }
}

export function documentBounds(document: SketchDocument): Bounds2D {
  if (document.shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: document.width, maxY: document.height };
  }

  return selectionBounds(document.shapes, document.points);
}

export function selectionBounds(shapes: SketchShape[], points: SketchPoint[]): Bounds2D {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const bounds = shapes.map(s => shapeBounds(s, points));
  return {
    minX: Math.min(...bounds.map((b) => b.minX)),
    minY: Math.min(...bounds.map((b) => b.minY)),
    maxX: Math.max(...bounds.map((b) => b.maxX)),
    maxY: Math.max(...bounds.map((b) => b.maxY)),
  };
}

export function groupBounds(document: SketchDocument, groupId: string): Bounds2D {
  return selectionBounds(
    document.shapes.filter((shape) => shape.groupId === groupId),
    document.points
  );
}

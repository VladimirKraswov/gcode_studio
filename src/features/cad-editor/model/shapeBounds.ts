import {
  arcEndPoint,
  arcStartPoint,
  boundsFromPoints,
  rotateCadPoint,
  sampleArcPoints,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { SketchDocument, SketchShape } from "./types";

export type Bounds2D = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function shapeBounds(shape: SketchShape): Bounds2D {
  switch (shape.type) {
    case "rectangle": {
      const rotation = shape.rotation ?? 0;

      if (!rotation) {
        return {
          minX: shape.x,
          minY: shape.y,
          maxX: shape.x + shape.width,
          maxY: shape.y + shape.height,
        };
      }

      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;

      const points = [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height },
      ].map((point) => rotateCadPoint(point, { x: cx, y: cy }, rotation));

      return boundsFromPoints(points);
    }

    case "circle":
      return {
        minX: shape.cx - shape.radius,
        minY: shape.cy - shape.radius,
        maxX: shape.cx + shape.radius,
        maxY: shape.cy + shape.radius,
      };

    case "line":
      return boundsFromPoints([
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
      ]);

    case "arc": {
      const points = sampleArcPoints(
        { x: shape.cx, y: shape.cy },
        shape.radius,
        shape.startAngle,
        shape.endAngle,
        shape.clockwise,
        72,
      );

      return boundsFromPoints(points);
    }

    case "polyline":
      return boundsFromPoints(shape.points);

    case "text": {
      const widthApprox =
        Math.max(1, shape.text.length) * (shape.height * 0.62 + shape.letterSpacing);

      const baseBounds = {
        minX:
          shape.align === "center"
            ? shape.x - widthApprox / 2
            : shape.align === "right"
              ? shape.x - widthApprox
              : shape.x,
        minY: shape.y - shape.height * 0.25,
        maxX:
          shape.align === "center"
            ? shape.x + widthApprox / 2
            : shape.align === "right"
              ? shape.x
              : shape.x + widthApprox,
        maxY: shape.y + shape.height,
      };

      const rotation = shape.rotation ?? 0;
      if (!rotation) {
        return baseBounds;
      }

      const corners = [
        { x: baseBounds.minX, y: baseBounds.minY },
        { x: baseBounds.maxX, y: baseBounds.minY },
        { x: baseBounds.maxX, y: baseBounds.maxY },
        { x: baseBounds.minX, y: baseBounds.maxY },
      ].map((point) => rotateCadPoint(point, { x: shape.x, y: shape.y }, rotation));

      return boundsFromPoints(corners);
    }

    case "svg": {
      const rotation = shape.rotation ?? 0;

      if (!rotation) {
        return {
          minX: shape.x,
          minY: shape.y,
          maxX: shape.x + shape.width,
          maxY: shape.y + shape.height,
        };
      }

      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;

      const corners = [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height },
      ].map((point) => rotateCadPoint(point, { x: cx, y: cy }, rotation));

      return boundsFromPoints(corners);
    }
  }
}

export function documentBounds(document: SketchDocument): Bounds2D {
  if (document.shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: document.width, maxY: document.height };
  }

  return selectionBounds(document.shapes);
}

export function selectionBounds(shapes: SketchShape[]): Bounds2D {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const bounds = shapes.map(shapeBounds);
  return {
    minX: Math.min(...bounds.map((b) => b.minX)),
    minY: Math.min(...bounds.map((b) => b.minY)),
    maxX: Math.max(...bounds.map((b) => b.maxX)),
    maxY: Math.max(...bounds.map((b) => b.maxY)),
  };
}

export function groupBounds(document: SketchDocument, groupId: string): Bounds2D {
  return selectionBounds(document.shapes.filter((shape) => shape.groupId === groupId));
}
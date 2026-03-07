// path: /src/modules/cad/model/shapeBounds.ts
import type { SketchDocument, SketchShape } from "./types";

export type Bounds2D = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function rotatePoint(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

function boundsFromPoints(points: Array<{ x: number; y: number }>): Bounds2D {
  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

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
      ].map((point) => rotatePoint(point, { x: cx, y: cy }, rotation));

      return boundsFromPoints(points);
    }

    case "circle":
      return {
        minX: shape.cx - shape.radius,
        minY: shape.cy - shape.radius,
        maxX: shape.cx + shape.radius,
        maxY: shape.cy + shape.radius,
      };

    case "polyline": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }

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
      ].map((point) => rotatePoint(point, { x: shape.x, y: shape.y }, rotation));

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
      ].map((point) => rotatePoint(point, { x: cx, y: cy }, rotation));

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
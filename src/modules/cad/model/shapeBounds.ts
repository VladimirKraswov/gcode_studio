// path: /src/modules/cad/model/shapeBounds.ts
import type { SketchDocument, SketchShape } from "./types";

export type Bounds2D = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function shapeBounds(shape: SketchShape): Bounds2D {
  switch (shape.type) {
    case "rectangle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
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
      return {
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
    }
    case "svg":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
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
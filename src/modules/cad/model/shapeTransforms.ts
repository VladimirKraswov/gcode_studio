// path: /src/modules/cad/model/shapeTransforms.ts
import type { CadPoint } from "../../../utils/fontGeometry";
import type { SketchShape } from "./types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function scalePoint(point: CadPoint, origin: CadPoint, sx: number, sy: number): CadPoint {
  return {
    x: round(origin.x + (point.x - origin.x) * sx),
    y: round(origin.y + (point.y - origin.y) * sy),
  };
}

export function moveShape(shape: SketchShape, dx: number, dy: number): SketchShape {
  switch (shape.type) {
    case "rectangle":
      return { ...shape, x: round(shape.x + dx), y: round(shape.y + dy) };
    case "circle":
      return { ...shape, cx: round(shape.cx + dx), cy: round(shape.cy + dy) };
    case "polyline":
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: round(p.x + dx), y: round(p.y + dy) })),
      };
    case "text":
      return { ...shape, x: round(shape.x + dx), y: round(shape.y + dy) };
    case "svg":
      return { ...shape, x: round(shape.x + dx), y: round(shape.y + dy) };
  }
}

export function rotatePoint(point: CadPoint, origin: CadPoint, angleDeg: number): CadPoint {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: round(origin.x + dx * cos - dy * sin),
    y: round(origin.y + dx * sin + dy * cos),
  };
}

export function rotateShape(shape: SketchShape, angle: number, origin: CadPoint): SketchShape {
  switch (shape.type) {
    case "rectangle": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = rotatePoint(center, origin, angle);

      return {
        ...shape,
        x: round(nextCenter.x - shape.width / 2),
        y: round(nextCenter.y - shape.height / 2),
        rotation: round((shape.rotation ?? 0) + angle),
      };
    }

    case "circle": {
      const p = rotatePoint({ x: shape.cx, y: shape.cy }, origin, angle);
      return { ...shape, cx: p.x, cy: p.y };
    }

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((p) => rotatePoint(p, origin, angle)),
      };

    case "text":
      return {
        ...shape,
        ...rotatePoint({ x: shape.x, y: shape.y }, origin, angle),
        rotation: round((shape.rotation ?? 0) + angle),
      };

    case "svg": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = rotatePoint(center, origin, angle);

      return {
        ...shape,
        x: round(nextCenter.x - shape.width / 2),
        y: round(nextCenter.y - shape.height / 2),
        rotation: round((shape.rotation ?? 0) + angle),
      };
    }
  }
}

export function scaleShape(
  shape: SketchShape,
  sx: number,
  sy: number,
  origin: CadPoint,
): SketchShape {
  switch (shape.type) {
    case "rectangle": {
      const topLeft = scalePoint({ x: shape.x, y: shape.y }, origin, sx, sy);

      return {
        ...shape,
        x: topLeft.x,
        y: topLeft.y,
        width: round(shape.width * sx),
        height: round(shape.height * sy),
      };
    }

    case "circle": {
      const p = scalePoint({ x: shape.cx, y: shape.cy }, origin, sx, sy);
      return {
        ...shape,
        cx: p.x,
        cy: p.y,
        radius: round(shape.radius * Math.max(sx, sy)),
      };
    }

    case "polyline":
      return { ...shape, points: shape.points.map((p) => scalePoint(p, origin, sx, sy)) };

    case "text": {
      const p = scalePoint({ x: shape.x, y: shape.y }, origin, sx, sy);
      return {
        ...shape,
        x: p.x,
        y: p.y,
        height: round(shape.height * sy),
        letterSpacing: round(shape.letterSpacing * sx),
      };
    }

    case "svg": {
      const p = scalePoint({ x: shape.x, y: shape.y }, origin, sx, sy);
      return {
        ...shape,
        x: p.x,
        y: p.y,
        width: round(shape.width * sx),
        height: round(shape.height * sy),
      };
    }
  }
}
import type { CadPoint } from "../../../utils/fontGeometry";
import {
  rotateCadPoint,
  scaleCadPoint,
  translateCadPoint,
} from "../../geometry/geometryEngine";
import type { SketchShape } from "./types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

export function moveShape(shape: SketchShape, dx: number, dy: number): SketchShape {
  switch (shape.type) {
    case "rectangle": {
      const next = translateCadPoint({ x: shape.x, y: shape.y }, dx, dy);
      return { ...shape, x: next.x, y: next.y };
    }

    case "circle": {
      const next = translateCadPoint({ x: shape.cx, y: shape.cy }, dx, dy);
      return { ...shape, cx: next.x, cy: next.y };
    }

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((point) => translateCadPoint(point, dx, dy)),
      };

    case "text": {
      const next = translateCadPoint({ x: shape.x, y: shape.y }, dx, dy);
      return { ...shape, x: next.x, y: next.y };
    }

    case "svg": {
      const next = translateCadPoint({ x: shape.x, y: shape.y }, dx, dy);
      return { ...shape, x: next.x, y: next.y };
    }
  }
}

export function rotatePoint(point: CadPoint, origin: CadPoint, angleDeg: number): CadPoint {
  return rotateCadPoint(point, origin, angleDeg);
}

export function rotateShape(shape: SketchShape, angle: number, origin: CadPoint): SketchShape {
  switch (shape.type) {
    case "rectangle": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = rotateCadPoint(center, origin, angle);

      return {
        ...shape,
        x: round(nextCenter.x - shape.width / 2),
        y: round(nextCenter.y - shape.height / 2),
        rotation: round((shape.rotation ?? 0) + angle),
      };
    }

    case "circle": {
      const next = rotateCadPoint({ x: shape.cx, y: shape.cy }, origin, angle);
      return { ...shape, cx: next.x, cy: next.y };
    }

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((point) => rotateCadPoint(point, origin, angle)),
      };

    case "text": {
      const next = rotateCadPoint({ x: shape.x, y: shape.y }, origin, angle);
      return {
        ...shape,
        x: next.x,
        y: next.y,
        rotation: round((shape.rotation ?? 0) + angle),
      };
    }

    case "svg": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = rotateCadPoint(center, origin, angle);

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
      const topLeft = scaleCadPoint({ x: shape.x, y: shape.y }, origin, sx, sy);

      return {
        ...shape,
        x: topLeft.x,
        y: topLeft.y,
        width: round(shape.width * sx),
        height: round(shape.height * sy),
      };
    }

    case "circle": {
      const next = scaleCadPoint({ x: shape.cx, y: shape.cy }, origin, sx, sy);
      return {
        ...shape,
        cx: next.x,
        cy: next.y,
        radius: round(shape.radius * Math.max(sx, sy)),
      };
    }

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((point) => scaleCadPoint(point, origin, sx, sy)),
      };

    case "text": {
      const next = scaleCadPoint({ x: shape.x, y: shape.y }, origin, sx, sy);
      return {
        ...shape,
        x: next.x,
        y: next.y,
        height: round(shape.height * sy),
        letterSpacing: round(shape.letterSpacing * sx),
      };
    }

    case "svg": {
      const next = scaleCadPoint({ x: shape.x, y: shape.y }, origin, sx, sy);
      return {
        ...shape,
        x: next.x,
        y: next.y,
        width: round(shape.width * sx),
        height: round(shape.height * sy),
      };
    }
  }
}
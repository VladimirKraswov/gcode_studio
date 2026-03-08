import type { CadPoint } from "../../../utils/fontGeometry";
import {
  rotateCadPoint,
  scaleCadPoint,
  translateCadPoint,
} from "../../geometry/geometryEngine";
import type { MirrorAxis, SketchShape } from "./types";

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

    case "line": {
      const p1 = translateCadPoint({ x: shape.x1, y: shape.y1 }, dx, dy);
      const p2 = translateCadPoint({ x: shape.x2, y: shape.y2 }, dx, dy);
      return {
        ...shape,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      };
    }

    case "arc": {
      const next = translateCadPoint({ x: shape.cx, y: shape.cy }, dx, dy);
      return {
        ...shape,
        cx: next.x,
        cy: next.y,
      };
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

    case "line": {
      const p1 = rotateCadPoint({ x: shape.x1, y: shape.y1 }, origin, angle);
      const p2 = rotateCadPoint({ x: shape.x2, y: shape.y2 }, origin, angle);
      return {
        ...shape,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      };
    }

    case "arc": {
      const nextCenter = rotateCadPoint({ x: shape.cx, y: shape.cy }, origin, angle);
      return {
        ...shape,
        cx: nextCenter.x,
        cy: nextCenter.y,
        startAngle: round(shape.startAngle + angle),
        endAngle: round(shape.endAngle + angle),
      };
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

    case "line": {
      const p1 = scaleCadPoint({ x: shape.x1, y: shape.y1 }, origin, sx, sy);
      const p2 = scaleCadPoint({ x: shape.x2, y: shape.y2 }, origin, sx, sy);
      return {
        ...shape,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      };
    }

    case "arc": {
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

function mirrorPoint(point: CadPoint, axis: MirrorAxis, origin: CadPoint): CadPoint {
  return axis === "x"
    ? { x: round(point.x), y: round(origin.y - (point.y - origin.y)) }
    : { x: round(origin.x - (point.x - origin.x)), y: round(point.y) };
}

function mirrorAngle(angleDeg: number, axis: MirrorAxis): number {
  return round(axis === "x" ? -angleDeg : 180 - angleDeg);
}

export function mirrorShape(
  shape: SketchShape,
  axis: MirrorAxis,
  origin: CadPoint,
): SketchShape {
  switch (shape.type) {
    case "rectangle": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = mirrorPoint(center, axis, origin);
      const nextRotation =
        axis === "x"
          ? round(-(shape.rotation ?? 0))
          : round(180 - (shape.rotation ?? 0));

      return {
        ...shape,
        x: round(nextCenter.x - shape.width / 2),
        y: round(nextCenter.y - shape.height / 2),
        rotation: nextRotation,
      };
    }

    case "circle": {
      const next = mirrorPoint({ x: shape.cx, y: shape.cy }, axis, origin);
      return { ...shape, cx: next.x, cy: next.y };
    }

    case "line": {
      const p1 = mirrorPoint({ x: shape.x1, y: shape.y1 }, axis, origin);
      const p2 = mirrorPoint({ x: shape.x2, y: shape.y2 }, axis, origin);
      return { ...shape, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }

    case "arc": {
      const center = mirrorPoint({ x: shape.cx, y: shape.cy }, axis, origin);
      return {
        ...shape,
        cx: center.x,
        cy: center.y,
        startAngle: mirrorAngle(shape.startAngle, axis),
        endAngle: mirrorAngle(shape.endAngle, axis),
        clockwise: !shape.clockwise,
      };
    }

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((point) => mirrorPoint(point, axis, origin)),
      };

    case "text": {
      const next = mirrorPoint({ x: shape.x, y: shape.y }, axis, origin);
      return {
        ...shape,
        x: next.x,
        y: next.y,
        rotation: mirrorAngle(shape.rotation ?? 0, axis),
      };
    }

    case "svg": {
      const center = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = mirrorPoint(center, axis, origin);
      return {
        ...shape,
        x: round(nextCenter.x - shape.width / 2),
        y: round(nextCenter.y - shape.height / 2),
        rotation: mirrorAngle(shape.rotation ?? 0, axis),
      };
    }
  }
}
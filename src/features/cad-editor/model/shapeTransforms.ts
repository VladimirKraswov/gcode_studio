import type { CadPoint } from "@/utils/fontGeometry";
import {
  rotateCadPoint,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { MirrorAxis, SketchShape } from "./types";

/**
 * In a parametric system, moveShape usually moves the underlying points.
 */
export function moveShape(shape: SketchShape, dx: number, dy: number): SketchShape {
  if (shape.type === "text" || shape.type === "svg") {
    return {
      ...shape,
      x: (shape.x ?? 0) + dx,
      y: (shape.y ?? 0) + dy,
    } as any;
  }
  return shape;
}

export function rotatePoint(point: CadPoint, origin: CadPoint, angleDeg: number): CadPoint {
  return rotateCadPoint(point, origin, angleDeg);
}

export function rotateShape(shape: SketchShape, angle: number, _origin: CadPoint): SketchShape {
  if (shape.type === "text" || shape.type === "svg") {
    return {
      ...shape,
      rotation: (shape.rotation ?? 0) + angle,
    } as any;
  }
  return shape;
}

export function scaleShape(
  shape: SketchShape,
  sx: number,
  _sy: number,
  _origin: CadPoint,
): SketchShape {
  if (shape.type === "text" || shape.type === "svg") {
    return {
      ...shape,
      scale: (shape.scale ?? 1) * sx,
    } as any;
  }
  return shape;
}

export function mirrorShape(
  shape: SketchShape,
  _axis: MirrorAxis,
  _origin: CadPoint,
): SketchShape {
  return shape;
}

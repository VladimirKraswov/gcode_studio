import type { CadPoint } from "@/utils/fontGeometry";
import {
  rotateCadPoint,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { MirrorAxis, SketchShape } from "./types";

/**
 * In a parametric system, moveShape usually moves the underlying points.
 */
export function moveShape(shape: SketchShape, _dx: number, _dy: number): SketchShape {
  return shape;
}

export function rotatePoint(point: CadPoint, origin: CadPoint, angleDeg: number): CadPoint {
  return rotateCadPoint(point, origin, angleDeg);
}

export function rotateShape(shape: SketchShape, _angle: number, _origin: CadPoint): SketchShape {
  return shape;
}

export function scaleShape(
  shape: SketchShape,
  _sx: number,
  _sy: number,
  _origin: CadPoint,
): SketchShape {
  return shape;
}

export function mirrorShape(
  shape: SketchShape,
  _axis: MirrorAxis,
  _origin: CadPoint,
): SketchShape {
  return shape;
}

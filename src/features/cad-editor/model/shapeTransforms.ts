import type { CadPoint } from "@/utils/fontGeometry";
import {
  rotateCadPoint,
  scaleCadPoint,
  translateCadPoint,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { MirrorAxis, SketchShape, SketchPoint } from "./types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

/**
 * In a parametric system, moveShape usually moves the underlying points.
 * This function is kept for compatibility but should be used with caution.
 */
export function moveShape(shape: SketchShape, dx: number, dy: number): SketchShape {
  return shape; // In the new model, we move points via movePointsAndSolve
}

export function rotatePoint(point: CadPoint, origin: CadPoint, angleDeg: number): CadPoint {
  return rotateCadPoint(point, origin, angleDeg);
}

export function rotateShape(shape: SketchShape, angle: number, origin: CadPoint): SketchShape {
  return shape; // Parametric rotation not yet implemented as a direct transform
}

export function scaleShape(
  shape: SketchShape,
  sx: number,
  sy: number,
  origin: CadPoint,
): SketchShape {
  return shape; // Parametric scaling not yet implemented
}

function mirrorPoint(point: CadPoint, axis: MirrorAxis, origin: CadPoint): CadPoint {
  return axis === "x"
    ? { x: round(point.x), y: round(origin.y - (point.y - origin.y)) }
    : { x: round(origin.x - (point.x - origin.x)), y: round(point.y) };
}

export function mirrorShape(
  shape: SketchShape,
  axis: MirrorAxis,
  origin: CadPoint,
): SketchShape {
  return shape; // Mirroring is handled by mirroring points in operations.ts
}

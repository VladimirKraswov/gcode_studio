import type {
  SketchCircle,
  SketchDocument,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
} from "../modules/cad/model/types";

export { createId } from "../modules/cad/model/ids";
export { createEmptySketchDocument } from "../modules/cad/model/document";
export { shapeBounds } from "../modules/cad/model/shapeBounds";
export { moveShape } from "../modules/cad/model/shapeTransforms";
export { generateSketchGCode } from "../modules/cam/gcode/generator";

export function updateRectangle(
  shape: SketchRectangle,
  patch: Partial<SketchRectangle>,
): SketchRectangle {
  return { ...shape, ...patch };
}

export function updateCircle(
  shape: SketchCircle,
  patch: Partial<SketchCircle>,
): SketchCircle {
  return { ...shape, ...patch };
}

export function updatePolyline(
  shape: SketchPolyline,
  patch: Partial<SketchPolyline>,
): SketchPolyline {
  return { ...shape, ...patch };
}

export function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}
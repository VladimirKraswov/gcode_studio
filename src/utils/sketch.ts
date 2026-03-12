import type {
  SketchCircle,
  SketchDocument,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
} from "@/features/cad-editor/model/types";
import { generateSketchGCode } from "@/features/cad-editor/cam/generateSketchGCode";

export { createId } from "@/features/cad-editor/model/ids";
export { createEmptySketchDocument } from "@/features/cad-editor/model/document";
export { shapeBounds } from "@/features/cad-editor/model/shapeBounds";
export { moveShape } from "@/features/cad-editor/model/shapeTransforms";
export { generateSketchGCode };

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

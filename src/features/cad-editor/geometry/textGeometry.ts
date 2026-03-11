import { getTextPolylines as buildTextPolylines } from "@/utils/fontGeometry";
import type { CadPoint } from "@/utils/fontGeometry";
import type { SketchText } from "../model/types";

export type { CadPoint };

export async function getTextPolylines(shape: SketchText): Promise<CadPoint[][]> {
  return buildTextPolylines(shape);
}

export async function getTextBounds(shape: SketchText) {
  const polylines = await getTextPolylines(shape);

  if (polylines.length === 0) {
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x,
      maxY: shape.y,
    };
  }

  const points = polylines.flat();

  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}
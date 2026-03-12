import { getTextPolylines as buildTextPolylines } from "@/utils/fontGeometry";
import type { CadPoint } from "@/utils/fontGeometry";
import type { SketchText, SketchPoint } from "../model/types";

export type { CadPoint };

export async function getTextPolylines(shape: SketchText, _points: SketchPoint[]): Promise<CadPoint[][]> {
  return buildTextPolylines(shape, _points);
}

export async function getTextBounds(shape: SketchText, points: SketchPoint[]) {
  const polylines = await getTextPolylines(shape, points);

  if (polylines.length === 0) {
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x + 10,
      maxY: shape.y + 10,
    };
  }

  const flatPoints = polylines.flat();

  return {
    minX: Math.min(...flatPoints.map((p) => p.x)),
    minY: Math.min(...flatPoints.map((p) => p.y)),
    maxX: Math.max(...flatPoints.map((p) => p.x)),
    maxY: Math.max(...flatPoints.map((p) => p.y)),
  };
}
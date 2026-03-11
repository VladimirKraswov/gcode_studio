import { getTextPolylines as buildTextPolylines } from "@/utils/fontGeometry";
import type { CadPoint } from "@/utils/fontGeometry";
import type { SketchText, SketchPoint } from "../model/types";

export type { CadPoint };

export async function getTextPolylines(shape: SketchText, points: SketchPoint[]): Promise<CadPoint[][]> {
  return buildTextPolylines(shape, points);
}

export async function getTextBounds(shape: SketchText, points: SketchPoint[]) {
  const polylines = await getTextPolylines(shape, points);

  if (polylines.length === 0) {
    const anchor = points.find(p => p.id === shape.anchorPoint) || { x: 0, y: 0 };
    return {
      minX: anchor.x,
      minY: anchor.y,
      maxX: anchor.x,
      maxY: anchor.y,
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
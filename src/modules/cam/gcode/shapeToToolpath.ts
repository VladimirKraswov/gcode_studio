import type { SketchCircle, SketchDocument, SketchPolyline, SketchRectangle, SketchShape, SketchText } from "../../cad/model/types";
import { getTextPolylines } from "../../cad/geometry/textGeometry";
import type { Toolpath } from "../types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

function circleToPolylinePoints(shape: SketchCircle, segments = 72) {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push({ x: round(shape.cx + Math.cos(t) * shape.radius), y: round(shape.cy + Math.sin(t) * shape.radius) });
  }
  return points;
}

export function rectangleToToolpath(shape: SketchRectangle, doc: SketchDocument): Toolpath {
  return {
    name: `RECTANGLE ${shape.name}`,
    closed: true,
    cutZ: resolveCutZ(shape, doc),
    points: [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ],
  };
}

export function circleToToolpath(shape: SketchCircle, doc: SketchDocument): Toolpath {
  return {
    name: `CIRCLE ${shape.name}`,
    closed: true,
    cutZ: resolveCutZ(shape, doc),
    points: circleToPolylinePoints(shape, 72),
  };
}

export function polylineToToolpath(shape: SketchPolyline, doc: SketchDocument): Toolpath {
  return {
    name: `POLYLINE ${shape.name}`,
    closed: shape.closed,
    cutZ: resolveCutZ(shape, doc),
    points: shape.points,
  };
}

export async function textToToolpaths(shape: SketchText, doc: SketchDocument): Promise<Toolpath[]> {
  const polylines = await getTextPolylines(shape);
  const cutZ = resolveCutZ(shape, doc);
  return polylines
    .filter((polyline) => polyline.length >= 2)
    .map((polyline, index) => ({
      name: `TEXT ${shape.name} #${index + 1}`,
      closed: false,
      cutZ,
      points: polyline,
    }));
}

export async function shapeToToolpaths(shape: SketchShape, doc: SketchDocument): Promise<Toolpath[]> {
  switch (shape.type) {
    case "rectangle": return [rectangleToToolpath(shape, doc)];
    case "circle": return [circleToToolpath(shape, doc)];
    case "polyline": return [polylineToToolpath(shape, doc)];
    case "text": return textToToolpaths(shape, doc);
  }
}

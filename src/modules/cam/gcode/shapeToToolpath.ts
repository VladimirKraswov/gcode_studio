// path: /src/modules/cam/gcode/shapeToToolpath.ts
import type {
  SketchCircle,
  SketchDocument,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
  SketchSvg,
  SketchText,
} from "../../cad/model/types";
import { getTextPolylines } from "../../cad/geometry/textGeometry";
import type { Toolpath, ToolpathPoint } from "../types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

function resolveStrokeWidth(shape: SketchShape): number {
  return Math.max(0.1, shape.strokeWidth ?? 1);
}

function buildBandOffsets(
  targetWidth: number,
  toolDiameter: number,
  stepover: number,
): number[] {
  const width = Math.max(0.1, targetWidth);
  const radiusBand = width / 2;

  if (toolDiameter >= width) {
    return [0];
  }

  const step = Math.max(
    0.05,
    toolDiameter * Math.max(0.05, Math.min(1, stepover)),
  );
  const maxCenterOffset = Math.max(0, radiusBand - toolDiameter / 2);

  if (maxCenterOffset <= 0.0001) {
    return [0];
  }

  const offsets: number[] = [0];

  for (let d = step; d < maxCenterOffset - 1e-6; d += step) {
    offsets.push(round(d), round(-d));
  }

  offsets.push(round(maxCenterOffset), round(-maxCenterOffset));

  return Array.from(new Set(offsets)).sort((a, b) => a - b);
}

function circleToPolylinePoints(
  radius: number,
  cx: number,
  cy: number,
  segments = 96,
): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push({
      x: round(cx + Math.cos(t) * radius),
      y: round(cy + Math.sin(t) * radius),
    });
  }
  return points;
}

function rectangleOffsetLoop(
  shape: SketchRectangle,
  centerOffset: number,
): ToolpathPoint[] | null {
  const half = centerOffset;
  const x = shape.x - half;
  const y = shape.y - half;
  const w = shape.width + half * 2;
  const h = shape.height + half * 2;

  if (w <= 0 || h <= 0) return null;

  return [
    { x: round(x), y: round(y) },
    { x: round(x + w), y: round(y) },
    { x: round(x + w), y: round(y + h) },
    { x: round(x), y: round(y + h) },
  ];
}

function polylineNormal(a: ToolpathPoint, b: ToolpathPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

function offsetPolylinePoints(
  points: ToolpathPoint[],
  offset: number,
): ToolpathPoint[] {
  if (points.length < 2 || Math.abs(offset) < 1e-9) {
    return points.map((p) => ({ ...p }));
  }

  const result: ToolpathPoint[] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (i === 0) {
      const n = polylineNormal(points[0], points[1]);
      result.push({
        x: round(points[0].x + n.x * offset),
        y: round(points[0].y + n.y * offset),
      });
      continue;
    }

    if (i === points.length - 1) {
      const n = polylineNormal(points[i - 1], points[i]);
      result.push({
        x: round(points[i].x + n.x * offset),
        y: round(points[i].y + n.y * offset),
      });
      continue;
    }

    const n1 = polylineNormal(points[i - 1], points[i]);
    const n2 = polylineNormal(points[i], points[i + 1]);
    const nx = n1.x + n2.x;
    const ny = n1.y + n2.y;
    const nlen = Math.hypot(nx, ny) || 1;

    result.push({
      x: round(points[i].x + (nx / nlen) * offset),
      y: round(points[i].y + (ny / nlen) * offset),
    });
  }

  return result;
}

function isToolpath(value: Toolpath | null): value is Toolpath {
  return value !== null;
}

export function rectangleToToolpaths(
  shape: SketchRectangle,
  doc: SketchDocument,
): Toolpath[] {
  const cutZ = resolveCutZ(shape, doc);
  const bandOffsets = buildBandOffsets(
    resolveStrokeWidth(shape),
    doc.toolDiameter,
    doc.stepover,
  );

  const result: Array<Toolpath | null> = bandOffsets.map((bandOffset, index) => {
    const path = rectangleOffsetLoop(shape, bandOffset);
    if (!path || path.length < 2) return null;

    return {
      name: `RECTANGLE ${shape.name} #${index + 1}`,
      closed: true,
      cutZ,
      points: path,
    };
  });

  return result.filter(isToolpath);
}

export function circleToToolpaths(
  shape: SketchCircle,
  doc: SketchDocument,
): Toolpath[] {
  const cutZ = resolveCutZ(shape, doc);
  const strokeWidth = resolveStrokeWidth(shape);
  const bandOffsets = buildBandOffsets(strokeWidth, doc.toolDiameter, doc.stepover);

  const result: Array<Toolpath | null> = bandOffsets.map((bandOffset, index) => {
    const radius = shape.radius + bandOffset;
    if (radius <= 0.001) return null;

    return {
      name: `CIRCLE ${shape.name} #${index + 1}`,
      closed: true,
      cutZ,
      points: circleToPolylinePoints(radius, shape.cx, shape.cy, 96),
    };
  });

  return result.filter(isToolpath);
}

export function polylineToToolpaths(
  shape: SketchPolyline,
  doc: SketchDocument,
): Toolpath[] {
  const cutZ = resolveCutZ(shape, doc);
  const strokeWidth = resolveStrokeWidth(shape);
  const bandOffsets = buildBandOffsets(strokeWidth, doc.toolDiameter, doc.stepover);

  return bandOffsets.map((offset, index) => ({
    name: `POLYLINE ${shape.name} #${index + 1}`,
    closed: shape.closed,
    cutZ,
    points: offsetPolylinePoints(shape.points, offset),
  }));
}

export async function textToToolpaths(
  shape: SketchText,
  doc: SketchDocument,
): Promise<Toolpath[]> {
  const polylines = await getTextPolylines(shape);
  const cutZ = resolveCutZ(shape, doc);
  const bandOffsets = buildBandOffsets(
    resolveStrokeWidth(shape),
    doc.toolDiameter,
    doc.stepover,
  );

  const toolpaths: Toolpath[] = [];

  polylines
    .filter((polyline) => polyline.length >= 2)
    .forEach((polyline, polylineIndex) => {
      for (let i = 0; i < bandOffsets.length; i += 1) {
        toolpaths.push({
          name: `TEXT ${shape.name} #${polylineIndex + 1}.${i + 1}`,
          closed: false,
          cutZ,
          points: offsetPolylinePoints(polyline, bandOffsets[i]),
        });
      }
    });

  return toolpaths;
}

export function svgToToolpaths(
  shape: SketchSvg,
  doc: SketchDocument,
): Toolpath[] {
  const cutZ = resolveCutZ(shape, doc);
  const bandOffsets = buildBandOffsets(
    resolveStrokeWidth(shape),
    doc.toolDiameter,
    doc.stepover,
  );

  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);

  const baseContours = shape.contours
    .map((contour) =>
      contour.map((point) => ({
        x: round(shape.x + point.x * scaleX),
        y: round(shape.y + point.y * scaleY),
      })),
    )
    .filter((contour) => contour.length >= 2);

  const toolpaths: Toolpath[] = [];

  baseContours.forEach((contour, contourIndex) => {
    bandOffsets.forEach((offset, offsetIndex) => {
      toolpaths.push({
        name: `SVG ${shape.name} #${contourIndex + 1}.${offsetIndex + 1}`,
        closed:
          contour.length > 2 &&
          Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 &&
          Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001,
        cutZ,
        points: offsetPolylinePoints(contour, offset),
      });
    });
  });

  return toolpaths;
}

export async function shapeToToolpaths(
  shape: SketchShape,
  doc: SketchDocument,
): Promise<Toolpath[]> {
  switch (shape.type) {
    case "rectangle":
      return rectangleToToolpaths(shape, doc);
    case "circle":
      return circleToToolpaths(shape, doc);
    case "polyline":
      return polylineToToolpaths(shape, doc);
    case "text":
      return textToToolpaths(shape, doc);
    case "svg":
      return svgToToolpaths(shape, doc);
  }
}
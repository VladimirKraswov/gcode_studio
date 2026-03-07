import type {
  SketchCircle,
  SketchDocument,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
  SketchText,
} from "../types/sketch";
import { getTextPolylines } from "./fontGeometry";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function fmt(value: number): string {
  return round(value).toFixed(3).replace(/\.?0+$/, "");
}

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

export function createId(prefix = "shape"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptySketchDocument(): SketchDocument {
  return {
    width: 300,
    height: 180,
    safeZ: 5,
    cutZ: -1,
    feedCut: 500,
    feedRapid: 1200,
    spindleOn: false,
    laserPower: 800,
    shapes: [],
  };
}

export function shapeBounds(shape: SketchShape) {
  switch (shape.type) {
    case "rectangle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };

    case "circle":
      return {
        minX: shape.cx - shape.radius,
        minY: shape.cy - shape.radius,
        maxX: shape.cx + shape.radius,
        maxY: shape.cy + shape.radius,
      };

    case "polyline": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }

    case "text": {
      const widthApprox =
        Math.max(1, shape.text.length) *
        (shape.height * 0.62 + shape.letterSpacing);

      return {
        minX:
          shape.align === "center"
            ? shape.x - widthApprox / 2
            : shape.align === "right"
              ? shape.x - widthApprox
              : shape.x,
        minY: shape.y - shape.height * 0.25,
        maxX:
          shape.align === "center"
            ? shape.x + widthApprox / 2
            : shape.align === "right"
              ? shape.x
              : shape.x + widthApprox,
        maxY: shape.y + shape.height,
      };
    }
  }
}

export function moveShape(shape: SketchShape, dx: number, dy: number): SketchShape {
  switch (shape.type) {
    case "rectangle":
      return { ...shape, x: round(shape.x + dx), y: round(shape.y + dy) };

    case "circle":
      return { ...shape, cx: round(shape.cx + dx), cy: round(shape.cy + dy) };

    case "polyline":
      return {
        ...shape,
        points: shape.points.map((p) => ({
          x: round(p.x + dx),
          y: round(p.y + dy),
        })),
      };

    case "text":
      return {
        ...shape,
        x: round(shape.x + dx),
        y: round(shape.y + dy),
      };
  }
}

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

function emitCutStart(doc: SketchDocument, cutZ = doc.cutZ): string[] {
  if (doc.spindleOn) {
    return [`M3 S${Math.max(0, Math.round(doc.laserPower))}`];
  }

  return [`G1 Z${fmt(cutZ)} F${fmt(doc.feedCut)}`];
}

function emitCutEnd(doc: SketchDocument): string[] {
  if (doc.spindleOn) {
    return ["M5"];
  }

  return [`G0 Z${fmt(doc.safeZ)} F${fmt(doc.feedRapid)}`];
}

function emitMoveTo(x: number, y: number, feedRapid: number): string[] {
  return [`G0 X${fmt(x)} Y${fmt(y)} F${fmt(feedRapid)}`];
}

function rectangleToGCode(shape: SketchRectangle, doc: SketchDocument): string[] {
  const x1 = shape.x;
  const y1 = shape.y;
  const x2 = shape.x + shape.width;
  const y2 = shape.y + shape.height;
  const cutZ = resolveCutZ(shape, doc);

  return [
    `; RECTANGLE ${shape.name}`,
    ...emitMoveTo(x1, y1, doc.feedRapid),
    ...emitCutStart(doc, cutZ),
    `G1 X${fmt(x2)} Y${fmt(y1)} F${fmt(doc.feedCut)}`,
    `G1 X${fmt(x2)} Y${fmt(y2)} F${fmt(doc.feedCut)}`,
    `G1 X${fmt(x1)} Y${fmt(y2)} F${fmt(doc.feedCut)}`,
    `G1 X${fmt(x1)} Y${fmt(y1)} F${fmt(doc.feedCut)}`,
    ...emitCutEnd(doc),
  ];
}

function circleToPolylinePoints(shape: SketchCircle, segments = 72) {
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push({
      x: round(shape.cx + Math.cos(t) * shape.radius),
      y: round(shape.cy + Math.sin(t) * shape.radius),
    });
  }

  return points;
}

function polylinePointsToGCode(
  name: string,
  points: Array<{ x: number; y: number }>,
  closed: boolean,
  doc: SketchDocument,
  cutZ = doc.cutZ,
): string[] {
  if (points.length < 2) {
    return [];
  }

  const lines: string[] = [
    `; POLYLINE ${name}`,
    ...emitMoveTo(points[0].x, points[0].y, doc.feedRapid),
    ...emitCutStart(doc, cutZ),
  ];

  for (let i = 1; i < points.length; i += 1) {
    lines.push(`G1 X${fmt(points[i].x)} Y${fmt(points[i].y)} F${fmt(doc.feedCut)}`);
  }

  if (closed) {
    lines.push(`G1 X${fmt(points[0].x)} Y${fmt(points[0].y)} F${fmt(doc.feedCut)}`);
  }

  lines.push(...emitCutEnd(doc));

  return lines;
}

function circleToGCode(shape: SketchCircle, doc: SketchDocument): string[] {
  const points = circleToPolylinePoints(shape, 72);
  return polylinePointsToGCode(shape.name, points, true, doc, resolveCutZ(shape, doc));
}

function polylineToGCode(shape: SketchPolyline, doc: SketchDocument): string[] {
  return polylinePointsToGCode(
    shape.name,
    shape.points,
    shape.closed,
    doc,
    resolveCutZ(shape, doc),
  );
}

async function textToGCode(shape: SketchText, doc: SketchDocument): Promise<string[]> {
  const cutZ = resolveCutZ(shape, doc);
  const polylines = await getTextPolylines(shape);
  const lines: string[] = [`; TEXT ${shape.name}: ${shape.text}`];

  for (const polyline of polylines) {
    if (polyline.length < 2) {
      continue;
    }

    lines.push(...emitMoveTo(polyline[0].x, polyline[0].y, doc.feedRapid));
    lines.push(...emitCutStart(doc, cutZ));

    for (let i = 1; i < polyline.length; i += 1) {
      lines.push(`G1 X${fmt(polyline[i].x)} Y${fmt(polyline[i].y)} F${fmt(doc.feedCut)}`);
    }

    lines.push(...emitCutEnd(doc));
  }

  return lines;
}

export async function generateSketchGCode(doc: SketchDocument): Promise<string> {
  const lines: string[] = [
    "; Generated by GCode Studio / EditTab",
    "G21",
    "G90",
    `G0 Z${fmt(doc.safeZ)}`,
  ];

  for (const shape of doc.shapes) {
    switch (shape.type) {
      case "rectangle":
        lines.push(...rectangleToGCode(shape, doc));
        break;

      case "circle":
        lines.push(...circleToGCode(shape, doc));
        break;

      case "polyline":
        lines.push(...polylineToGCode(shape, doc));
        break;

      case "text":
        lines.push(...(await textToGCode(shape, doc)));
        break;
    }
  }

  lines.push(`G0 Z${fmt(doc.safeZ)}`);
  lines.push("G0 X0 Y0");

  return lines.join("\n") + "\n";
}
import type {
  CamOperationType,
  SketchArc,
  SketchCircle,
  SketchDocument,
  SketchLine,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
  SketchSvg,
  SketchText,
} from "../../cad/model/types";
import { getTextPolylines } from "../../cad/geometry/textGeometry";
import { rotateCadPoint, sampleArcPoints } from "../../geometry/geometryEngine";
import type { Toolpath, ToolpathPoint } from "../types";
import { buildContourOffsets } from "../algorithms/offsetBuilder";
import { generateParallelPocket } from "../algorithms/pocketing";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

function rotatePoint(point: ToolpathPoint, origin: ToolpathPoint, angleDeg: number): ToolpathPoint {
  return rotateCadPoint(point, origin, angleDeg);
}

function resolveCam(shape: SketchShape, doc: SketchDocument) {
  const docCam = doc.defaultCamSettings;
  const shapeCam = shape.camSettings ?? {};
  return {
    operation: shapeCam.operation ?? docCam.operation,
    direction: shapeCam.direction ?? docCam.direction,
    stepdown: shapeCam.stepdown ?? docCam.stepdown,
    stepover: shapeCam.stepover ?? docCam.stepover,
    tabs: {
      enabled: shapeCam.tabs?.enabled ?? docCam.tabs.enabled,
      count: shapeCam.tabs?.count ?? docCam.tabs.count,
      width: shapeCam.tabs?.width ?? docCam.tabs.width,
      height: shapeCam.tabs?.height ?? docCam.tabs.height,
    },
    ramping: {
      enabled: shapeCam.ramping?.enabled ?? docCam.ramping.enabled,
      turns: shapeCam.ramping?.turns ?? docCam.ramping.turns,
    },
  };
}

function rectangleToPoints(shape: SketchRectangle): ToolpathPoint[] {
  const points = [
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y },
    { x: shape.x + shape.width, y: shape.y + shape.height },
    { x: shape.x, y: shape.y + shape.height },
  ];
  const rotation = shape.rotation ?? 0;
  if (!rotation) return points;
  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  return points.map(p => rotatePoint(p, center, rotation));
}

function circleToPoints(shape: SketchCircle, segments = 96): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push({ x: round(shape.cx + Math.cos(t) * shape.radius), y: round(shape.cy + Math.sin(t) * shape.radius) });
  }
  return points;
}

function lineToPoints(shape: SketchLine): ToolpathPoint[] {
  return [{ x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }];
}

function arcToPoints(shape: SketchArc, segments = 72): ToolpathPoint[] {
  return sampleArcPoints(
    { x: shape.cx, y: shape.cy },
    shape.radius,
    shape.startAngle,
    shape.endAngle,
    shape.clockwise,
    segments
  );
}

function polylineToPoints(shape: SketchPolyline): ToolpathPoint[] {
  return shape.points.map(p => ({ x: p.x, y: p.y }));
}

function polylineNormal(a: ToolpathPoint, b: ToolpathPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

function offsetPolylinePoints(points: ToolpathPoint[], offset: number): ToolpathPoint[] {
  if (points.length < 2 || Math.abs(offset) < 1e-9) return points.map(p => ({ ...p }));
  const result: ToolpathPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      const n = polylineNormal(points[0], points[1]);
      result.push({ x: round(points[0].x + n.x * offset), y: round(points[0].y + n.y * offset) });
    } else if (i === points.length - 1) {
      const n = polylineNormal(points[i - 1], points[i]);
      result.push({ x: round(points[i].x + n.x * offset), y: round(points[i].y + n.y * offset) });
    } else {
      const n1 = polylineNormal(points[i - 1], points[i]);
      const n2 = polylineNormal(points[i], points[i + 1]);
      const nx = n1.x + n2.x;
      const ny = n1.y + n2.y;
      const nlen = Math.hypot(nx, ny) || 1;
      result.push({ x: round(points[i].x + (nx / nlen) * offset), y: round(points[i].y + (ny / nlen) * offset) });
    }
  }
  return result;
}

function offsetLinePoints(start: ToolpathPoint, end: ToolpathPoint, offset: number): ToolpathPoint[] {
  if (Math.abs(offset) < 1e-9) return [{ ...start }, { ...end }];
  const n = polylineNormal(start, end);
  return [
    { x: round(start.x + n.x * offset), y: round(start.y + n.y * offset) },
    { x: round(end.x + n.x * offset), y: round(end.y + n.y * offset) },
  ];
}

function buildClosedToolpaths(name: string, contour: ToolpathPoint[], shape: SketchShape, doc: SketchDocument): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const cutZ = resolveCutZ(shape, doc);
  const stepover = cam.stepover ?? doc.stepover;
  const step = Math.max(0.05, doc.toolDiameter * Math.max(0.05, Math.min(1, stepover)));
  const toolRadius = doc.toolDiameter / 2;

  if (cam.operation === "follow-path") {
    return [{
      name,
      points: contour,
      closed: true,
      cutZ,
      kind: "contour",
      useRamping: cam.ramping.enabled && doc.toolType !== "laser",
      useBridges: cam.tabs.enabled,
      bridgeCount: cam.tabs.count,
      bridgeWidth: cam.tabs.width,
    }];
  }

  if (cam.operation === "profile-outside") {
    const offsets = buildContourOffsets(contour, true, step, toolRadius);
    const points = offsets[0] ?? contour;
    return [{
      name,
      points,
      closed: true,
      cutZ,
      kind: "contour",
      useRamping: cam.ramping.enabled && doc.toolType !== "laser",
      useBridges: cam.tabs.enabled,
      bridgeCount: cam.tabs.count,
      bridgeWidth: cam.tabs.width,
    }];
  }

  if (cam.operation === "profile-inside") {
    const offsets = buildContourOffsets(contour, false, step, toolRadius);
    const points = offsets[0] ?? contour;
    return [{
      name,
      points,
      closed: true,
      cutZ,
      kind: "contour",
      useRamping: cam.ramping.enabled && doc.toolType !== "laser",
      useBridges: cam.tabs.enabled,
      bridgeCount: cam.tabs.count,
      bridgeWidth: cam.tabs.width,
    }];
  }

  // pocket
  const pockets = generateParallelPocket(contour, step, 0);
  return pockets
    .filter(path => path.length >= 2)
    .map((path, index) => ({
      name: `${name} Pocket #${index + 1}`,
      points: path,
      closed: false,
      cutZ,
      kind: "pocket" as const,
      useRamping: false,
      useBridges: false,
    }));
}

function rectangleToToolpaths(shape: SketchRectangle, doc: SketchDocument): Toolpath[] {
  return buildClosedToolpaths(`RECTANGLE ${shape.name}`, rectangleToPoints(shape), shape, doc);
}

function circleToToolpaths(shape: SketchCircle, doc: SketchDocument): Toolpath[] {
  return buildClosedToolpaths(`CIRCLE ${shape.name}`, circleToPoints(shape), shape, doc);
}

function lineToToolpaths(shape: SketchLine, doc: SketchDocument): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const cutZ = resolveCutZ(shape, doc);
  if (cam.operation !== "follow-path") {
    return [{ name: `LINE ${shape.name}`, closed: false, cutZ, kind: "contour", useRamping: false, points: lineToPoints(shape) }];
  }
  return [{ name: `LINE ${shape.name}`, closed: false, cutZ, kind: "contour", useRamping: false, points: lineToPoints(shape) }];
}

function arcToToolpaths(shape: SketchArc, doc: SketchDocument): Toolpath[] {
  return [{
    name: `ARC ${shape.name}`,
    points: arcToPoints(shape),
    closed: false,
    cutZ: resolveCutZ(shape, doc),
    kind: "contour",
    useRamping: false,
  }];
}

function polylineToToolpaths(shape: SketchPolyline, doc: SketchDocument): Toolpath[] {
  if (shape.closed) {
    return buildClosedToolpaths(`POLYLINE ${shape.name}`, polylineToPoints(shape), shape, doc);
  }
  return [{
    name: `POLYLINE ${shape.name}`,
    points: polylineToPoints(shape),
    closed: false,
    cutZ: resolveCutZ(shape, doc),
    kind: "contour",
    useRamping: false,
  }];
}

async function textToToolpaths(shape: SketchText, doc: SketchDocument): Promise<Toolpath[]> {
  const polylines = await getTextPolylines(shape);
  return polylines
    .filter(poly => poly.length >= 2)
    .flatMap((poly, idx) => buildClosedToolpaths(`TEXT ${shape.name} #${idx + 1}`, poly, shape, doc));
}

function svgToToolpaths(shape: SketchSvg, doc: SketchDocument): Toolpath[] {
  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const rotation = shape.rotation ?? 0;
  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  const contours = shape.contours
    .map(contour => contour.map(point => {
      const next = { x: round(shape.x + point.x * scaleX), y: round(shape.y + point.y * scaleY) };
      return rotation ? rotatePoint(next, center, rotation) : next;
    }))
    .filter(contour => contour.length >= 2);

  return contours.flatMap((contour, idx) => {
    const isClosed = contour.length >= 3 &&
      Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 &&
      Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001;
    if (isClosed) {
      return buildClosedToolpaths(`SVG ${shape.name} #${idx + 1}`, contour, shape, doc);
    }
    return [{
      name: `SVG ${shape.name} #${idx + 1}`,
      points: contour,
      closed: false,
      cutZ: resolveCutZ(shape, doc),
      kind: "contour",
      useRamping: false,
    }];
  });
}

export async function shapeToToolpaths(shape: SketchShape, doc: SketchDocument): Promise<Toolpath[]> {
  switch (shape.type) {
    case "rectangle": return rectangleToToolpaths(shape, doc);
    case "circle": return circleToToolpaths(shape, doc);
    case "line": return lineToToolpaths(shape, doc);
    case "arc": return arcToToolpaths(shape, doc);
    case "polyline": return polylineToToolpaths(shape, doc);
    case "text": return textToToolpaths(shape, doc);
    case "svg": return svgToToolpaths(shape, doc);
  }
}
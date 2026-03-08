import type {
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
import { buildOffset } from "../algorithms/offsetBuilder";
import { generateBestPocket } from "../algorithms/pocketing";

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

function signedArea(points: ToolpathPoint[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function normalizeClosed(points: ToolpathPoint[]): ToolpathPoint[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) <= 0.001) {
    return points.slice(0, -1);
  }
  return [...points];
}

function closeIfNeeded(points: ToolpathPoint[]): ToolpathPoint[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) <= 0.001) return [...points];
  return [...points, { ...first }];
}

function reverseIfNeeded(
  points: ToolpathPoint[],
  closed: boolean,
  operation: "follow-path" | "profile-inside" | "profile-outside" | "pocket",
  direction: "climb" | "conventional"
): ToolpathPoint[] {
  if (!closed || points.length < 3) {
    return direction === "conventional" ? [...points].reverse() : points;
  }

  const ccw = signedArea(normalizeClosed(points)) > 0;

  const wantCCW =
    operation === "profile-inside"
      ? direction === "climb"
      : direction !== "climb";

  return ccw === wantCCW ? points : [...points].reverse();
}

function rectangleToPoints(shape: SketchRectangle): ToolpathPoint[] {
  const points = [
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y },
    { x: shape.x + shape.width, y: shape.y + shape.height },
    { x: shape.x, y: shape.y + shape.height },
    { x: shape.x, y: shape.y },
  ];

  const rotation = shape.rotation ?? 0;
  if (!rotation) return points;

  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  return points.map((p) => rotatePoint(p, center, rotation));
}

function circleToPoints(shape: SketchCircle, segments = 96): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push({
      x: round(shape.cx + Math.cos(t) * shape.radius),
      y: round(shape.cy + Math.sin(t) * shape.radius),
    });
  }
  return points;
}

function lineToPoints(shape: SketchLine): ToolpathPoint[] {
  return [
    { x: shape.x1, y: shape.y1 },
    { x: shape.x2, y: shape.y2 },
  ];
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
  const points = shape.points.map((p) => ({ x: p.x, y: p.y }));
  if (
    shape.closed &&
    points.length >= 3 &&
    (Math.abs(points[0].x - points[points.length - 1].x) > 0.001 ||
      Math.abs(points[0].y - points[points.length - 1].y) > 0.001)
  ) {
    points.push({ ...points[0] });
  }
  return points;
}

function buildClosedToolpaths(
  name: string,
  contour: ToolpathPoint[],
  shape: SketchShape,
  doc: SketchDocument
): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const cutZ = resolveCutZ(shape, doc);
  const toolRadius = Math.max(0.001, doc.toolDiameter / 2);

  const stepoverRatio = cam.stepover ?? doc.stepover;
  const stepoverDistance = Math.max(
    0.05,
    doc.toolDiameter * Math.max(0.05, Math.min(1, stepoverRatio))
  );

  const isPocket = cam.operation === "pocket";
  const allowTabs = !isPocket && cam.tabs.enabled;
  const allowRamping = !isPocket && cam.ramping.enabled && doc.toolType !== "laser";

  const buildResult = (paths: ToolpathPoint[][], kind: "contour" | "pocket"): Toolpath[] =>
    paths
      .filter((p) => p.length >= 2)
      .map((points, index) => {
        const closedPoints = kind === "contour" ? closeIfNeeded(points) : points;
        return {
          name: index === 0 ? name : `${name} #${index + 1}`,
          points: reverseIfNeeded(closedPoints, kind === "contour", cam.operation, cam.direction),
          closed: kind === "contour",
          cutZ,
          kind,
          useRamping: kind === "contour" && allowRamping,
          useBridges: kind === "contour" && allowTabs,
          bridgeCount: allowTabs ? cam.tabs.count : 0,
          bridgeWidth: allowTabs ? cam.tabs.width : 0,
          bridgeHeight: allowTabs ? cam.tabs.height : 0,
          rampTurns: allowRamping ? cam.ramping.turns : 0,
          stepdown: cam.stepdown ?? doc.passDepth,
          leadIn: {
            enabled: kind === "contour",
            length: Math.max(doc.toolDiameter, 1),
          },
          leadOut: {
            enabled: kind === "contour",
            length: Math.max(doc.toolDiameter * 0.5, 0.5),
          },
        } as Toolpath;
      })
      .filter((p) => p.points.length >= 2);

  if (cam.operation === "follow-path") {
    return buildResult([contour], "contour");
  }

  if (cam.operation === "profile-outside") {
    const loops = buildOffset(contour, toolRadius, "round", 4);
    return buildResult(loops.length > 0 ? [loops[0]] : [contour], "contour");
  }

  if (cam.operation === "profile-inside") {
    const loops = buildOffset(contour, -toolRadius, "round", 4);
    return buildResult(loops.length > 0 ? [loops[0]] : [contour], "contour");
  }

  return buildResult(generateBestPocket([contour], stepoverDistance, 0), "pocket");
}

function rectangleToToolpaths(shape: SketchRectangle, doc: SketchDocument): Toolpath[] {
  return buildClosedToolpaths(`RECTANGLE ${shape.name}`, rectangleToPoints(shape), shape, doc);
}

function circleToToolpaths(shape: SketchCircle, doc: SketchDocument): Toolpath[] {
  return buildClosedToolpaths(`CIRCLE ${shape.name}`, circleToPoints(shape), shape, doc);
}

function lineToToolpaths(shape: SketchLine, doc: SketchDocument): Toolpath[] {
  const cam = resolveCam(shape, doc);

  return [
    {
      name: `LINE ${shape.name}`,
      points: reverseIfNeeded(lineToPoints(shape), false, "follow-path", cam.direction),
      closed: false,
      cutZ: resolveCutZ(shape, doc),
      kind: "contour",
      useRamping: false,
      useBridges: false,
      stepdown: cam.stepdown ?? doc.passDepth,
      leadIn: { enabled: false, length: 0 },
      leadOut: { enabled: false, length: 0 },
    },
  ];
}

function arcToToolpaths(shape: SketchArc, doc: SketchDocument): Toolpath[] {
  const cam = resolveCam(shape, doc);

  return [
    {
      name: `ARC ${shape.name}`,
      points: reverseIfNeeded(arcToPoints(shape), false, "follow-path", cam.direction),
      closed: false,
      cutZ: resolveCutZ(shape, doc),
      kind: "contour",
      useRamping: false,
      useBridges: false,
      stepdown: cam.stepdown ?? doc.passDepth,
      leadIn: { enabled: false, length: 0 },
      leadOut: { enabled: false, length: 0 },
    },
  ];
}

function polylineToToolpaths(shape: SketchPolyline, doc: SketchDocument): Toolpath[] {
  if (shape.closed) {
    return buildClosedToolpaths(`POLYLINE ${shape.name}`, polylineToPoints(shape), shape, doc);
  }

  const cam = resolveCam(shape, doc);
  return [
    {
      name: `POLYLINE ${shape.name}`,
      points: reverseIfNeeded(polylineToPoints(shape), false, "follow-path", cam.direction),
      closed: false,
      cutZ: resolveCutZ(shape, doc),
      kind: "contour",
      useRamping: false,
      useBridges: false,
      stepdown: cam.stepdown ?? doc.passDepth,
      leadIn: { enabled: false, length: 0 },
      leadOut: { enabled: false, length: 0 },
    },
  ];
}

async function textToToolpaths(shape: SketchText, doc: SketchDocument): Promise<Toolpath[]> {
  const polylines = await getTextPolylines(shape);
  const isPocket = shape.cutMode === "pocket";

  return polylines
    .filter((poly) => poly.length >= 2)
    .flatMap((poly, idx) => {
      const camShape = isPocket
        ? {
            ...shape,
            camSettings: {
              ...(shape.camSettings ?? {}),
              operation: "pocket" as const,
            },
          }
        : shape;

      return buildClosedToolpaths(`TEXT ${shape.name} #${idx + 1}`, poly, camShape, doc);
    });
}

function svgToToolpaths(shape: SketchSvg, doc: SketchDocument): Toolpath[] {
  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const rotation = shape.rotation ?? 0;
  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };

  const contours = shape.contours
    .map((contour) =>
      contour.map((point) => {
        const next = {
          x: round(shape.x + point.x * scaleX),
          y: round(shape.y + point.y * scaleY),
        };
        return rotation ? rotatePoint(next, center, rotation) : next;
      })
    )
    .filter((contour) => contour.length >= 2);

  return contours.flatMap((contour, idx) => {
    const isClosed =
      contour.length >= 3 &&
      Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 &&
      Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001;

    if (isClosed) {
      return buildClosedToolpaths(`SVG ${shape.name} #${idx + 1}`, contour, shape, doc);
    }

    const cam = resolveCam(shape, doc);
    return [
      {
        name: `SVG ${shape.name} #${idx + 1}`,
        points: reverseIfNeeded(contour, false, "follow-path", cam.direction),
        closed: false,
        cutZ: resolveCutZ(shape, doc),
        kind: "contour",
        useRamping: false,
        useBridges: false,
        stepdown: cam.stepdown ?? doc.passDepth,
        leadIn: { enabled: false, length: 0 },
        leadOut: { enabled: false, length: 0 },
      },
    ];
  });
}

export async function shapeToToolpaths(shape: SketchShape, doc: SketchDocument): Promise<Toolpath[]> {
  switch (shape.type) {
    case "rectangle":
      return rectangleToToolpaths(shape, doc);
    case "circle":
      return circleToToolpaths(shape, doc);
    case "line":
      return lineToToolpaths(shape, doc);
    case "arc":
      return arcToToolpaths(shape, doc);
    case "polyline":
      return polylineToToolpaths(shape, doc);
    case "text":
      return textToToolpaths(shape, doc);
    case "svg":
      return svgToToolpaths(shape, doc);
  }
}
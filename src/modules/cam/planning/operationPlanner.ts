import type {
  CamOperationType,
  SketchDocument,
  SketchShape,
} from "../../cad/model/types";
import { buildOffset } from "../algorithms/offsetBuilder";
import { generateBestPocket } from "../algorithms/pocketing";
import type { Toolpath } from "../types";
import type { GeometryContour } from "./shapeGeometry";

type ResolvedCamSettings = {
  operation: CamOperationType;
  direction: "climb" | "conventional";
  stepdown: number | null;
  stepover: number | null;
  tabs: {
    enabled: boolean;
    count: number;
    width: number;
    height: number;
  };
  ramping: {
    enabled: boolean;
    turns: number;
  };
};

type PlannedToolpathOptions = {
  closed: boolean;
  kind: "contour" | "pocket";
  operation: CamOperationType;
  allowTabs: boolean;
  allowRamping: boolean;
};

function resolveCam(shape: SketchShape, doc: SketchDocument): ResolvedCamSettings {
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

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

function signedArea(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  const count = points.length;

  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % count];
    area += a.x * b.y - b.x * a.y;
  }

  return area / 2;
}

function normalizeClosed(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 2) return [...points];

  const first = points[0];
  const last = points[points.length - 1];
  const alreadyClosed =
    Math.hypot(first.x - last.x, first.y - last.y) <= 0.001;

  return alreadyClosed ? points.slice(0, -1) : [...points];
}

function closeIfNeeded(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 2) return [...points];

  const first = points[0];
  const last = points[points.length - 1];
  const alreadyClosed =
    Math.hypot(first.x - last.x, first.y - last.y) <= 0.001;

  return alreadyClosed ? [...points] : [...points, { ...first }];
}

function orientPath(
  points: { x: number; y: number }[],
  closed: boolean,
  operation: CamOperationType,
  direction: "climb" | "conventional"
): { x: number; y: number }[] {
  if (!closed || points.length < 3) {
    return direction === "conventional" ? [...points].reverse() : [...points];
  }

  const open = normalizeClosed(points);
  const ccw = signedArea(open) > 0;

  const wantCCW =
    operation === "profile-inside"
      ? direction === "climb"
      : direction !== "climb";

  const oriented = ccw === wantCCW ? open : [...open].reverse();
  return closeIfNeeded(oriented);
}

function stepoverDistance(cam: ResolvedCamSettings, doc: SketchDocument): number {
  const ratio = cam.stepover ?? doc.stepover;
  return Math.max(
    0.05,
    doc.toolDiameter * Math.max(0.05, Math.min(1, ratio))
  );
}

function makeToolpath(
  name: string,
  points: { x: number; y: number }[],
  shape: SketchShape,
  doc: SketchDocument,
  cam: ResolvedCamSettings,
  options: PlannedToolpathOptions
): Toolpath {
  return {
    name,
    points: points.map((p) => ({ x: p.x, y: p.y })),
    closed: options.closed,
    cutZ: resolveCutZ(shape, doc),
    kind: options.kind,
    useRamping: options.allowRamping,
    useBridges: options.allowTabs,
    bridgeCount: options.allowTabs ? cam.tabs.count : 0,
    bridgeWidth: options.allowTabs ? cam.tabs.width : 0,
    bridgeHeight: options.allowTabs ? cam.tabs.height : 0,
    rampTurns: options.allowRamping ? cam.ramping.turns : 0,
    stepdown: cam.stepdown ?? doc.passDepth,
    leadIn: {
      enabled: false,
      length: 0,
    },
    leadOut: {
      enabled: false,
      length: 0,
    },
  };
}

function buildNameBase(shape: SketchShape, contour: GeometryContour, index: number): string {
  const suffix = contour.closed ? "Contour" : "Path";
  return `${shape.type.toUpperCase()} ${shape.name} ${suffix} ${index + 1}`;
}

function planFollowPath(
  shape: SketchShape,
  doc: SketchDocument,
  cam: ResolvedCamSettings,
  contour: GeometryContour,
  nameBase: string
): Toolpath[] {
  const closed = contour.closed;
  const points = orientPath(contour.points, closed, "follow-path", cam.direction);

  return [
    makeToolpath(nameBase, points, shape, doc, cam, {
      closed,
      kind: "contour",
      operation: "follow-path",
      allowTabs: closed && cam.tabs.enabled,
      allowRamping: closed && cam.ramping.enabled && doc.toolType !== "laser",
    }),
  ];
}

function planProfile(
  shape: SketchShape,
  doc: SketchDocument,
  cam: ResolvedCamSettings,
  contour: GeometryContour,
  nameBase: string,
  side: "inside" | "outside"
): Toolpath[] {
  if (!contour.closed) {
    return planFollowPath(shape, doc, cam, contour, nameBase);
  }

  const toolRadius = Math.max(0.001, doc.toolDiameter / 2);
  const offset = side === "outside" ? toolRadius : -toolRadius;
  const operation: CamOperationType =
    side === "outside" ? "profile-outside" : "profile-inside";

  const loops = buildOffset(contour.points, offset, "round", 4);
  const best = loops[0] ?? contour.points;
  const oriented = orientPath(best, true, operation, cam.direction);

  return [
    makeToolpath(nameBase, oriented, shape, doc, cam, {
      closed: true,
      kind: "contour",
      operation,
      allowTabs: cam.tabs.enabled,
      allowRamping: cam.ramping.enabled && doc.toolType !== "laser",
    }),
  ];
}

function planPocket(
  shape: SketchShape,
  doc: SketchDocument,
  cam: ResolvedCamSettings,
  contour: GeometryContour,
  nameBase: string
): Toolpath[] {
  if (!contour.closed) {
    return [];
  }

  const step = stepoverDistance(cam, doc);
  const pocketPaths = generateBestPocket([contour.points], step, 0);

  return pocketPaths.map((path, index) =>
    makeToolpath(
      `${nameBase} Pocket ${index + 1}`,
      orientPath(path, false, "pocket", cam.direction),
      shape,
      doc,
      cam,
      {
        closed: false,
        kind: "pocket",
        operation: "pocket",
        allowTabs: false,
        allowRamping: false,
      }
    )
  );
}

/**
 * Единая точка планирования 2D-операции для одного контура.
 * В будущем сюда можно добавить drill / engrave / v-carve
 * без изменений генератора G-code.
 */
export function planContourOperationFromGeometry(
  shape: SketchShape,
  doc: SketchDocument,
  contour: GeometryContour,
  index: number
): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const nameBase = buildNameBase(shape, contour, index);

  switch (cam.operation) {
    case "follow-path":
      return planFollowPath(shape, doc, cam, contour, nameBase);

    case "profile-outside":
      return planProfile(shape, doc, cam, contour, nameBase, "outside");

    case "profile-inside":
      return planProfile(shape, doc, cam, contour, nameBase, "inside");

    case "pocket":
      return planPocket(shape, doc, cam, contour, nameBase);

    default:
      return planFollowPath(shape, doc, cam, contour, nameBase);
  }
}
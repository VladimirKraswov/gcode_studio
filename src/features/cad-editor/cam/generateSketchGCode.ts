import type { SketchDocument, SketchShape } from "../model/types";
import { collectVisibleShapes } from "../model/grouping";
import { extractShapeContours } from "../geometry/shapeContours";
import { logger } from "@/shared/utils/logger";

import {
  generateGCode,
  optimizeTravel,
  planPocket,
  planProfile,
} from "@/shared/libs/cam-v2/src"

import type {
  Contour,
  MachineSettings,
  PocketPlanInput,
  ProfilePlanInput,
  Toolpath,
} from "@/shared/libs/cam-v2/src/types";

function clampStepover(value: number | null | undefined, fallback: number): number {
  const next = value ?? fallback;
  return Math.max(0.05, Math.min(1, next));
}

function toContour(points: { x: number; y: number }[]): Contour {
  return points.map((p) => ({ x: p.x, y: p.y }));
}

function ensureClosed(contour: Contour): Contour {
  if (contour.length < 2) return [...contour];
  const first = contour[0];
  const last = contour[contour.length - 1];
  const closed = Math.hypot(first.x - last.x, first.y - last.y) <= 0.001;
  return closed ? [...contour] : [...contour, { ...first }];
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

function resolveCutZ(shape: SketchShape, doc: SketchDocument): number {
  return shape.cutZ ?? doc.cutZ;
}

function buildTool(shape: SketchShape, doc: SketchDocument) {
  const cam = resolveCam(shape, doc);

  return {
    diameter: Math.max(0.001, doc.toolDiameter),
    passDepth: Math.max(0.001, Math.abs(cam.stepdown ?? doc.passDepth)),
    stepover: clampStepover(cam.stepover, doc.stepover),
  };
}

function buildMachine(doc: SketchDocument): MachineSettings {
  return {
    units: doc.units === "inch" ? "inch" : "mm",
    safeZ: doc.safeZ,
    startZ: doc.startZ,
    feedRapid: doc.feedRapid,
    feedCut: doc.feedCut,
    feedPlunge: doc.feedPlunge,
    workOffset: doc.workOffset,
    toolNumber: doc.toolNumber,
    coolant: doc.coolant,
    returnHome: doc.returnHome,
    spindle: {
      enabled: doc.spindleOn,
      speed: doc.toolType === "laser" ? Math.max(0, doc.laserPower) : Math.max(0, doc.spindleSpeed),
      direction: doc.spindleDirection,
      dwellMs: doc.dwellMs > 0 ? doc.dwellMs : undefined,
    },
  };
}

function buildProfileToolpaths(
  shape: SketchShape,
  doc: SketchDocument,
  contour: Contour,
  contourIndex: number,
): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const closed =
    contour.length >= 3 &&
    Math.hypot(
      contour[0].x - contour[contour.length - 1].x,
      contour[0].y - contour[contour.length - 1].y,
    ) <= 0.001;

  const requestedOperation = cam.operation;
  const operation =
    !closed && requestedOperation !== "follow-path"
      ? "follow-path"
      : requestedOperation === "pocket"
        ? "follow-path"
        : requestedOperation;

  const input: ProfilePlanInput = {
    contour: closed ? ensureClosed(contour) : [...contour],
    operation,
    tool: buildTool(shape, doc),
    options: {
      name: `${shape.type.toUpperCase()} ${shape.name} ${closed ? "Contour" : "Path"} ${contourIndex + 1}`,
      cutZ: resolveCutZ(shape, doc),
      joinType: "round",
      miterLimit: 4,
      direction: cam.direction,
      tabs: {
        enabled: cam.tabs.enabled,
        count: cam.tabs.count,
        width: cam.tabs.width,
        height: cam.tabs.height,
      },
      ramping: {
        enabled: cam.ramping.enabled && doc.toolType !== "laser",
        turns: cam.ramping.turns,
      },
      leadIn: {
        enabled: false,
        length: 0,
      },
      leadOut: {
        enabled: false,
        length: 0,
      },
    },
  };

  return planProfile(input);
}

function buildPocketToolpaths(
  shape: SketchShape,
  doc: SketchDocument,
  contours: Contour[],
): Toolpath[] {
  const cam = resolveCam(shape, doc);
  const closedContours = contours.map(ensureClosed).filter((c) => c.length >= 4);

  if (closedContours.length === 0) return [];

  const input: PocketPlanInput = {
    contours: closedContours,
    tool: buildTool(shape, doc),
    options: {
      name: `${shape.type.toUpperCase()} ${shape.name} Pocket`,
      cutZ: resolveCutZ(shape, doc),
      direction: cam.direction,
      strategy: "auto",
      angle: 0,
      tabs: {
        enabled: false,
        count: 0,
        width: 0.1,
        height: 0.1,
      },
      ramping: {
        enabled: false,
        turns: 1,
      },
      leadIn: {
        enabled: false,
        length: 0,
      },
      leadOut: {
        enabled: false,
        length: 0,
      },
    },
  };

  return planPocket(input);
}

function renumberToolpaths(toolpaths: Toolpath[]): Toolpath[] {
  return toolpaths.map((toolpath, index) => ({
    ...toolpath,
    name: `${String(index + 1).padStart(3, "0")} ${toolpath.name}`,
  }));
}

function normalizeForLaser(doc: SketchDocument, toolpaths: Toolpath[]): Toolpath[] {
  if (doc.toolType !== "laser") return toolpaths;

  return toolpaths.map((toolpath) => ({
    ...toolpath,
    cutZ: 0,
    stepdown: 1,
    tabs: {
      enabled: false,
      count: 0,
      width: 0.1,
      height: 0.1,
    },
    ramping: {
      enabled: false,
      turns: 1,
    },
    points: toolpath.points.map((p) => ({
      x: p.x,
      y: p.y,
      z: 0,
    })),
  }));
}

async function planDocumentToolpaths(doc: SketchDocument): Promise<Toolpath[]> {
  const visibleShapes = collectVisibleShapes(doc).filter((s) => !s.isConstruction);
  const rawToolpaths: Toolpath[] = [];

  logger.info("CAD", "Starting toolpath planning", {
    visibleShapes: visibleShapes.length,
    toolDiameter: doc.toolDiameter,
    units: doc.units
  });

  for (const shape of visibleShapes) {
    const geometryContours = await extractShapeContours(shape, doc.points);
    const contours = geometryContours.map((c) => toContour(c.points));
    const cam = resolveCam(shape, doc);

    if (cam.operation === "pocket") {
      const pocketPaths = buildPocketToolpaths(shape, doc, contours);
      logger.debug("CAM", `Generated ${pocketPaths.length} pocket paths for ${shape.name}`);
      rawToolpaths.push(...pocketPaths);
      continue;
    }

    for (let contourIndex = 0; contourIndex < contours.length; contourIndex++) {
      rawToolpaths.push(...buildProfileToolpaths(shape, doc, contours[contourIndex], contourIndex));
    }
  }

  if (rawToolpaths.length === 0) {
    logger.warn("CAM", "No toolpaths generated from visible shapes");
    return [];
  }

  const oriented = optimizeTravel(
    rawToolpaths.map((tp) => ({
      points: tp.points.map((p) => ({ x: p.x, y: p.y })),
      closed: tp.closed,
    })),
    { x: 0, y: 0 },
  );

  const reordered = oriented.map((item) => {
    const source = rawToolpaths[item.index];

    // Determine if the points were reversed by optimizeTravel
    const firstPoint = item.points[0];
    const sourceFirst = source.points[0];
    const sourceLast = source.points[source.points.length - 1];

    const distToFirst = Math.hypot(firstPoint.x - sourceFirst.x, firstPoint.y - sourceFirst.y);
    const distToLast = Math.hypot(firstPoint.x - sourceLast.x, firstPoint.y - sourceLast.y);

    const isReversed = distToLast < distToFirst;

    return {
      ...source,
      points: item.points.map((p, pIndex) => {
        // Map back to the original Z if possible
        const originalIndex = isReversed ? (source.points.length - 1 - pIndex) : pIndex;
        const originalZ = source.points[originalIndex]?.z ?? 0;

        return {
          x: p.x,
          y: p.y,
          z: originalZ,
        };
      }),
    };
  });

  logger.success("CAM", "Toolpath planning complete", {
    totalToolpaths: reordered.length,
    totalPoints: reordered.reduce((acc, tp) => acc + tp.points.length, 0)
  });

  return renumberToolpaths(reordered);
}

export async function generateSketchGCode(doc: SketchDocument): Promise<string> {
  const toolpaths = await planDocumentToolpaths(doc);
  const machine = buildMachine(doc);
  const normalizedToolpaths = normalizeForLaser(doc, toolpaths);

  return generateGCode({
    toolpaths: normalizedToolpaths,
    machine,
  });
}
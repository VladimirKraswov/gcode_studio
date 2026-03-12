import type { SketchCamSettings, SketchDocument, SketchShape, SketchPoint } from "./types";
import { getConstraintShapeIds } from "./constraints";

export function createDefaultCamSettings(): SketchCamSettings {
  return {
    operation: "follow-path",
    direction: "climb",
    stepdown: null,
    stepover: null,
    tabs: {
      enabled: false,
      count: 2,
      width: 6,
      height: 1,
    },
    ramping: {
      enabled: false,
      turns: 1,
    },
  };
}

function normalizeCamSettings(
  value: Partial<SketchCamSettings> | undefined,
): SketchCamSettings {
  const defaults = createDefaultCamSettings();
  return {
    operation: value?.operation ?? defaults.operation,
    direction: value?.direction ?? defaults.direction,
    stepdown: value?.stepdown ?? defaults.stepdown,
    stepover: value?.stepover ?? defaults.stepover,
    tabs: {
      enabled: value?.tabs?.enabled ?? defaults.tabs.enabled,
      count: value?.tabs?.count ?? defaults.tabs.count,
      width: value?.tabs?.width ?? defaults.tabs.width,
      height: value?.tabs?.height ?? defaults.tabs.height,
    },
    ramping: {
      enabled: value?.ramping?.enabled ?? defaults.ramping.enabled,
      turns: value?.ramping?.turns ?? defaults.ramping.turns,
    },
  };
}

function normalizeShape(shape: SketchShape): SketchShape {
  return {
    ...shape,
    visible: shape.visible ?? true,
    groupId: shape.groupId ?? null,
    camSettings: normalizeCamSettings(shape.camSettings),
  };
}

export function createEmptySketchDocument(): SketchDocument {
  return {
    width: 300,
    height: 180,
    units: "mm",
    workOffset: "G54",
    startZ: 5,
    safeZ: 5,
    cutZ: -1,
    passDepth: 1,
    feedCut: 500,
    feedPlunge: 180,
    feedRapid: 1200,
    spindleOn: false,
    spindleSpeed: 12000,
    spindleDirection: "cw",
    laserPower: 800,
    dwellMs: 0,
    coolant: false,
    returnHome: true,
    toolType: "router",
    toolNumber: 1,
    toolDiameter: 3.175,
    stepover: 0.45,
    defaultCamSettings: createDefaultCamSettings(),
    snapEnabled: true,
    snapStep: 5,
    points: [],
    shapes: [],
    groups: [],
    constraints: [],
    parameters: [],
  };
}

export function addShape(document: SketchDocument, shape: SketchShape): SketchDocument {
  return { ...document, shapes: [...document.shapes, normalizeShape(shape)] };
}

export function addPoint(document: SketchDocument, point: SketchPoint): SketchDocument {
  return { ...document, points: [...document.points, point] };
}

export function removeShape(document: SketchDocument, shapeId: string): SketchDocument {
  return {
    ...document,
    shapes: document.shapes.filter((shape) => shape.id !== shapeId),
    constraints: document.constraints.filter(
      (constraint) => !getConstraintShapeIds(constraint).includes(shapeId),
    ),
  };
}

export function updateShape(
  document: SketchDocument,
  shapeId: string,
  patch: Partial<SketchShape>,
): SketchDocument {
  return {
    ...document,
    shapes: document.shapes.map((shape) =>
      shape.id === shapeId ? normalizeShape({ ...shape, ...patch } as SketchShape) : shape,
    ),
  };
}

export function replaceShape(
  document: SketchDocument,
  shapeId: string,
  nextShape: SketchShape,
): SketchDocument {
  return {
    ...document,
    shapes: document.shapes.map((shape) =>
      shape.id === shapeId ? normalizeShape(nextShape) : shape,
    ),
  };
}

export function updatePoint(
  document: SketchDocument,
  pointId: string,
  patch: Partial<SketchPoint>,
): SketchDocument {
  return {
    ...document,
    points: document.points.map((p) => (p.id === pointId ? { ...p, ...patch } : p)),
  };
}
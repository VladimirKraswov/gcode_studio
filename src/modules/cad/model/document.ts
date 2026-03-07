

// =============================
// FILE: src/modules/cad/model/document.ts
// =============================

import type { SketchDocument, SketchShape } from "./types";

function normalizeShape(shape: SketchShape): SketchShape {
  return {
    ...shape,
    visible: shape.visible ?? true,
    groupId: shape.groupId ?? null,
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

    snapEnabled: true,
    snapStep: 5,
    shapes: [],
    groups: [],
  };
}

export function addShape(document: SketchDocument, shape: SketchShape): SketchDocument {
  return { ...document, shapes: [...document.shapes, normalizeShape(shape)] };
}

export function removeShape(document: SketchDocument, shapeId: string): SketchDocument {
  return {
    ...document,
    shapes: document.shapes.filter((shape) => shape.id !== shapeId),
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

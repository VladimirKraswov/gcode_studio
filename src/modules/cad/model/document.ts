import type { SketchDocument, SketchShape } from "./types";

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
    snapEnabled: true,
    snapStep: 5,
    shapes: [],
  };
}

export function addShape(document: SketchDocument, shape: SketchShape): SketchDocument {
  return { ...document, shapes: [...document.shapes, shape] };
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
      shape.id === shapeId ? ({ ...shape, ...patch } as SketchShape) : shape,
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
      shape.id === shapeId ? nextShape : shape,
    ),
  };
}

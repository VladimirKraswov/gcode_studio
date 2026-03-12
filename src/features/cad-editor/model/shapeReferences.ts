import type { SketchDocument, SketchShape } from "./types";

export function getShapePointIds(shape: SketchShape): string[] {
  const ids = new Set<string>();
  const s = shape as any;

  if (s.p1) ids.add(s.p1);
  if (s.p2) ids.add(s.p2);
  if (s.center) ids.add(s.center);
  if (s.majorAxisPoint) ids.add(s.majorAxisPoint);

  if (Array.isArray(s.pointIds)) {
    s.pointIds.forEach((id: string) => ids.add(id));
  }

  if (Array.isArray(s.controlPointIds)) {
    s.controlPointIds.forEach((id: string) => ids.add(id));
  }

  return [...ids];
}

export function collectUsedPointIdsFromShapes(shapes: SketchShape[]): Set<string> {
  const used = new Set<string>();
  shapes.forEach((shape) => {
    getShapePointIds(shape).forEach((id) => used.add(id));
  });
  return used;
}

export function getShapeById(
  document: SketchDocument,
  shapeId: string,
): SketchShape | null {
  return document.shapes.find((shape) => shape.id === shapeId) ?? null;
}
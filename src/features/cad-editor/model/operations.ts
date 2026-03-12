import { createPoint } from "./shapeFactory";
import { updatePoint } from "./document";
import type { SketchDocument, SketchShape } from "./types";
import { updateGeometry } from "./solver/manager";
import { createId } from "./ids";

/**
 * Trims a line by moving one of its end points to a new position.
 */
export function trimLine(
  document: SketchDocument,
  _lineId: string,
  pointId: string,
  newX: number,
  newY: number
): SketchDocument {
  return updatePoint(document, pointId, { x: newX, y: newY });
}

/**
 * Splits a line into two lines at a given point.
 */
export function splitLine(
  document: SketchDocument,
  lineId: string,
  splitX: number,
  splitY: number
): SketchDocument {
  const line = document.shapes.find(s => s.id === lineId);
  if (!line || line.type !== "line") return document;

  const splitPoint = createPoint(splitX, splitY);
  const newLine = {
    ...line,
    id: createId("line"),
    p1: splitPoint.id,
    p2: (line as any).p2,
    name: `${line.name} (split)`,
  };

  const updatedOldLine = {
    ...line,
    p2: splitPoint.id,
  };

  return {
    ...document,
    points: [...document.points, splitPoint],
    shapes: document.shapes
      .map(s => (s.id === lineId ? updatedOldLine : s))
      .concat(newLine as SketchShape),
  };
}

/**
 * Mirrors shapes across an axis.
 */
export function mirrorShapes(
  document: SketchDocument,
  shapeIds: string[],
  axis: "x" | "y",
  offset: number
): SketchDocument {
  let nextDoc = { ...document };
  const pointMap = new Map<string, string>();

  const affectedPointIds = new Set<string>();
  const shapesToMirror = document.shapes.filter(s => shapeIds.includes(s.id));

  shapesToMirror.forEach(s => {
    const shape = s as any;
    if ("p1" in shape) affectedPointIds.add(shape.p1);
    if ("p2" in shape) affectedPointIds.add(shape.p2);
    if ("center" in shape) affectedPointIds.add(shape.center);
    if ("pointIds" in shape) shape.pointIds.forEach((id: string) => affectedPointIds.add(id));
  });

  affectedPointIds.forEach(id => {
    const p = document.points.find(pt => pt.id === id)!;
    const newP = createPoint(
      axis === "y" ? 2 * offset - p.x : p.x,
      axis === "x" ? 2 * offset - p.y : p.y
    );
    nextDoc.points.push(newP);
    pointMap.set(id, newP.id);
  });

  const mirroredShapes = shapesToMirror.map(s => {
    const clone = { ...s, id: createId(s.type.slice(0, 4)) } as any;
    const source = s as any;
    if ("p1" in clone) clone.p1 = pointMap.get(source.p1)!;
    if ("p2" in clone) clone.p2 = pointMap.get(source.p2)!;
    if ("center" in clone) clone.center = pointMap.get(source.center)!;
    if ("pointIds" in clone) clone.pointIds = source.pointIds.map((id: string) => pointMap.get(id)!);
    return clone as SketchShape;
  });

  nextDoc.shapes = nextDoc.shapes.concat(mirroredShapes);
  return updateGeometry(nextDoc);
}

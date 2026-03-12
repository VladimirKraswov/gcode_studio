import { createId } from "./ids";
import type {
  MirrorAxis,
  SketchDocument,
  SketchPoint,
  SketchShape,
} from "./types";
import type { SelectionState } from "./selection";
import {
  clearSelection,
  makeShapeRef,
} from "./selection";
import {
  getConstraintPointIds,
  getConstraintShapeIds,
} from "./constraints";
import { getShapePointIds, collectUsedPointIdsFromShapes } from "./shapeReferences";
import { updateGeometry } from "./solver/manager";
import { createPoint as createPointShape } from "./shapeFactory";

function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_") || id.startsWith("pt-");
}

function collectSelectedShapes(
  document: SketchDocument,
  selection: SelectionState,
): SketchShape[] {
  return document.shapes.filter((shape) =>
    selection.refs.some((ref) => ref.kind === "shape" && ref.id === shape.id),
  );
}

function remapShapePointRefs(shape: SketchShape, pointMap: Map<string, string>): SketchShape {
  const clone = { ...shape } as any;

  if (clone.p1) clone.p1 = pointMap.get(clone.p1);
  if (clone.p2) clone.p2 = pointMap.get(clone.p2);
  if (clone.center) clone.center = pointMap.get(clone.center);
  if (clone.majorAxisPoint) clone.majorAxisPoint = pointMap.get(clone.majorAxisPoint);

  if (Array.isArray(clone.pointIds)) {
    clone.pointIds = clone.pointIds.map((id: string) => pointMap.get(id));
  }

  if (Array.isArray(clone.controlPointIds)) {
    clone.controlPointIds = clone.controlPointIds.map((id: string) => pointMap.get(id));
  }

  return clone as SketchShape;
}

export function normalizeSelectionForDocument(
  document: SketchDocument,
  selection: SelectionState,
): SelectionState {
  const existingShapeIds = new Set(document.shapes.map((shape) => shape.id));
  const existingPointIds = new Set(document.points.map((point) => point.id));
  const existingConstraintIds = new Set(document.constraints.map((constraint) => constraint.id));

  const refs = selection.refs.filter((ref) => {
    if (ref.kind === "shape") return existingShapeIds.has(ref.id);
    if (ref.kind === "point") return existingPointIds.has(ref.id);
    return existingConstraintIds.has(ref.id);
  });

  const primaryRef =
    selection.primaryRef &&
    refs.some(
      (ref) => ref.kind === selection.primaryRef?.kind && ref.id === selection.primaryRef?.id,
    )
      ? selection.primaryRef
      : refs[0] ?? null;

  return {
    refs,
    primaryRef,
    ids: refs.map((ref) => ref.id),
    primaryId: primaryRef?.id ?? null,
  };
}

export function deleteShapeCascade(
  document: SketchDocument,
  shapeId: string,
): SketchDocument {
  const remainingShapes = document.shapes.filter((shape) => shape.id !== shapeId);
  const usedPointIds = collectUsedPointIdsFromShapes(remainingShapes);

  return {
    ...document,
    shapes: remainingShapes,
    points: document.points.filter((point) => usedPointIds.has(point.id)),
    constraints: document.constraints.filter(
      (constraint) => !getConstraintShapeIds(constraint).includes(shapeId),
    ),
  };
}

export function deleteSelectedEntities(
  document: SketchDocument,
  selection: SelectionState,
): {
  document: SketchDocument;
  selection: SelectionState;
} {
  const selectedItemIds = new Set(selection.ids);
  const selectedConstraintIds = new Set(
    selection.refs
      .filter((ref) => ref.kind === "constraint")
      .map((ref) => ref.id),
  );

  const remainingShapes = document.shapes.filter((shape) => !selectedItemIds.has(shape.id));
  const remainingPoints = document.points.filter((point) => !selectedItemIds.has(point.id));
  const usedPointIds = collectUsedPointIdsFromShapes(remainingShapes);

  const nextPoints = remainingPoints.filter((point) => usedPointIds.has(point.id));
  const nextConstraints = document.constraints.filter((constraint) => {
    if (selectedConstraintIds.has(constraint.id)) return false;

    const pointIds = getConstraintPointIds(constraint);
    if (!pointIds.every((pointId) => usedPointIds.has(pointId))) return false;

    const targetShapeIds = getConstraintShapeIds(constraint);
    if (targetShapeIds.some((shapeId) => selectedItemIds.has(shapeId))) return false;

    return true;
  });

  const nextDocument: SketchDocument = {
    ...document,
    points: nextPoints,
    shapes: remainingShapes,
    constraints: nextConstraints,
  };

  return {
    document: nextDocument,
    selection: normalizeSelectionForDocument(nextDocument, clearSelection()),
  };
}

export function cloneSelectedEntities(
  document: SketchDocument,
  selection: SelectionState,
): {
  document: SketchDocument;
  selection: SelectionState;
} {
  const selectedShapes = collectSelectedShapes(document, selection);
  if (selectedShapes.length === 0) {
    return { document, selection };
  }

  const pointMap = new Map<string, string>();
  const clonedPoints: SketchPoint[] = [];
  const clonedShapes: SketchShape[] = [];

  const clonedConstraints = document.constraints
    .filter((constraint) =>
      constraint.targets.every((target) => {
        if (target.kind === "point") {
          return selectedShapes.some((shape) =>
            getShapePointIds(shape).includes(target.pointId),
          );
        }
        return selectedShapes.some((shape) => shape.id === target.shapeId);
      }),
    )
    .map((constraint) => ({
      ...constraint,
      id: createId("constraint"),
    }));

  selectedShapes.forEach((shape) => {
    getShapePointIds(shape).forEach((pointId) => {
      if (pointMap.has(pointId)) return;

      const original = document.points.find((point) => point.id === pointId);
      if (!original) return;

      const nextPoint: SketchPoint = {
        ...original,
        id: createId("pt"),
        x: original.x + 10,
        y: original.y + 10,
      };

      pointMap.set(pointId, nextPoint.id);
      clonedPoints.push(nextPoint);
    });
  });

  selectedShapes.forEach((shape) => {
    const clonedShape = remapShapePointRefs(
      { ...shape, id: createId(shape.type) },
      pointMap,
    );
    clonedShapes.push(clonedShape);
  });

  const nextConstraints = clonedConstraints.map((constraint) => ({
    ...constraint,
    targets: constraint.targets.map((target) => {
      if (target.kind === "point") {
        return {
          ...target,
          pointId: pointMap.get(target.pointId)!,
        };
      }

      const sourceIndex = selectedShapes.findIndex((shape) => shape.id === target.shapeId);
      if (sourceIndex < 0) return target;

      return {
        ...target,
        shapeId: clonedShapes[sourceIndex].id,
      };
    }),
  }));

  const nextDocument: SketchDocument = {
    ...document,
    points: [...document.points, ...clonedPoints],
    shapes: [...document.shapes, ...clonedShapes],
    constraints: [...document.constraints, ...nextConstraints],
  };

  const nextSelection: SelectionState = {
    refs: clonedShapes.map((shape) => makeShapeRef(shape.id)),
    primaryRef: clonedShapes[0] ? makeShapeRef(clonedShapes[0].id) : null,
    ids: clonedShapes.map((shape) => shape.id),
    primaryId: clonedShapes[0]?.id ?? null,
  };

  return {
    document: nextDocument,
    selection: nextSelection,
  };
}

export function mirrorSelectedEntities(
  document: SketchDocument,
  selection: SelectionState,
  axis: MirrorAxis,
): SketchDocument {
  const selectedShapes = collectSelectedShapes(document, selection);
  if (selectedShapes.length === 0) return document;

  const affectedPointIds = new Set<string>();
  selectedShapes.forEach((shape) => {
    getShapePointIds(shape).forEach((id) => affectedPointIds.add(id));
  });

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  affectedPointIds.forEach((pointId) => {
    const point = document.points.find((item) => item.id === pointId);
    if (!point) return;

    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return document;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return {
    ...document,
    points: document.points.map((point) => {
      if (!affectedPointIds.has(point.id)) return point;

      if (axis === "x") {
        return { ...point, y: cy - (point.y - cy) };
      }

      return { ...point, x: cx - (point.x - cx) };
    }),
  };
}

export function collectDraggedPointIds(
  document: SketchDocument,
  selectedIds: string[],
): {
  affectedPointIds: Set<string>;
  nonParametricShapeIds: Set<string>;
} {
  const affectedPointIds = new Set<string>();
  const nonParametricShapeIds = new Set<string>();

  selectedIds.forEach((id) => {
    if (isPointSelectionId(id)) {
      affectedPointIds.add(id);
      return;
    }

    const shape = document.shapes.find((item) => item.id === id);
    if (!shape) return;

    if (shape.type === "text" || shape.type === "svg") {
      nonParametricShapeIds.add(shape.id);
      return;
    }

    getShapePointIds(shape).forEach((pointId) => affectedPointIds.add(pointId));
  });

  return {
    affectedPointIds,
    nonParametricShapeIds,
  };
}

export function splitLineAtPoint(
  document: SketchDocument,
  lineId: string,
  cadX: number,
  cadY: number
): SketchDocument {
  const line = document.shapes.find(s => s.id === lineId);
  if (!line || line.type !== "line") return document;

  const newPt = createPointShape(cadX, cadY);
  const oldP2 = (line as any).p2;

  const newLine = {
    ...line,
    id: createId("line"),
    name: `${line.name} (Split)`,
    p1: newPt.id,
    p2: oldP2
  };

  const updatedLine = {
    ...line,
    p2: newPt.id
  };

  return {
    ...document,
    points: [...document.points, newPt],
    shapes: document.shapes.map(s => {
      if (s.id === line.id) return updatedLine as SketchShape;
      return s;
    }).concat(newLine as SketchShape)
  };
}

export function mergePoints(
    document: SketchDocument,
    p1Id: string,
    p2Id: string
): SketchDocument {
    if (p1Id === p2Id) return document;

    const p1 = document.points.find(p => p.id === p1Id);
    const p2 = document.points.find(p => p.id === p2Id);
    if (!p1 || !p2) return document;

    const targetId = p1Id;
    const sourceId = p2Id;

    const nextShapes = document.shapes.map(shape => {
        const s = { ...shape } as any;
        if (s.p1 === sourceId) s.p1 = targetId;
        if (s.p2 === sourceId) s.p2 = targetId;
        if (s.center === sourceId) s.center = targetId;
        if (s.majorAxisPoint === sourceId) s.majorAxisPoint = targetId;
        if (Array.isArray(s.pointIds)) {
            s.pointIds = s.pointIds.map((id: string) => id === sourceId ? targetId : id);
        }
        if (Array.isArray(s.controlPointIds)) {
            s.controlPointIds = s.controlPointIds.map((id: string) => id === sourceId ? targetId : id);
        }
        return s as SketchShape;
    });

    const nextConstraints = document.constraints.map(c => ({
        ...c,
        targets: c.targets.map(t => {
            if (t.kind === "point" && t.pointId === sourceId) {
                return { ...t, pointId: targetId };
            }
            return t;
        })
    }));

    const nextPoints = document.points.filter(p => p.id !== sourceId);

    return updateGeometry({
        ...document,
        points: nextPoints,
        shapes: nextShapes,
        constraints: nextConstraints
    });
}
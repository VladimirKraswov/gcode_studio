import type { SketchShape, SketchSelectionRef } from "./types";
import type { SelectionState } from "./selection";
import {
  isSelected,
  makePointRef,
  makeShapeRef,
  selectOnly,
  toggleSelection,
} from "./selection";
import { getDragShapeIds } from "./grouping";
import { shapeBounds } from "./shapeBounds";

export function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_") || id.startsWith("pt-");
}

export function normalizeSelectionRef(rawId: string, selectionMode: "primitive" | "object" = "primitive"): SketchSelectionRef {
  if (selectionMode === "object" && rawId.startsWith("point:")) {
    // Treat clicks on points as clicks on the shape itself in object mode
    // We expect the rawId to be something like "point:shapeId:pointId" or similar
    // Actually, in our system, rawId for points is usually just "point:pointId"
    // We need to map point back to shape if we want to be precise,
    // but for now, the UI usually passes the shapeId if it was a shape hit.
    return makeShapeRef(rawId.slice(6));
  }

  return rawId.startsWith("point:")
    ? makePointRef(rawId.slice(6))
    : makeShapeRef(rawId);
}

import type { SketchDocument } from "./types";
import { toState } from "./selection";

export function resolveSelectionOnPointerDown(params: {
  document: SketchDocument;
  selection: SelectionState;
  rawId: string;
  shiftKey: boolean;
  selectionMode?: "primitive" | "object";
}): {
  ref: SketchSelectionRef;
  nextSelection: SelectionState;
} {
  const { document, selection, rawId, shiftKey, selectionMode = "primitive" } = params;

  let refId = rawId;
  if (selectionMode === "object" && rawId.startsWith("point:")) {
      // Find the shape that uses this point
      const pointId = rawId.slice(6);
      const ownerShape = document.shapes.find(s => {
          if (s.type === 'line') return s.p1 === pointId || s.p2 === pointId;
          if (s.type === 'polyline') return s.pointIds.includes(pointId);
          if (s.type === 'circle' || s.type === 'arc' || s.type === 'ellipse' || s.type === 'ellipse-arc') return s.center === pointId || (s as any).p1 === pointId || (s as any).p2 === pointId || (s as any).majorAxisPoint === pointId;
          if (s.type === 'rectangle') return s.p1 === pointId || s.p2 === pointId;
          if (s.type === 'bspline') return s.controlPointIds.includes(pointId);
          return false;
      });
      if (ownerShape) refId = ownerShape.id;
  }

  let ref = normalizeSelectionRef(refId, selectionMode);

  // In 'object' mode, if we select a shape that belongs to a group, select the entire group
  if (selectionMode === "object" && ref.kind === "shape") {
    const shape = document.shapes.find((s) => s.id === ref.id);
    if (shape?.groupId && !shape.isConstruction) {
      const groupShapes = document.shapes.filter((s) => s.groupId === shape.groupId);
      if (groupShapes.length > 0) {
        const groupSelection = buildGroupShapeSelection(groupShapes);
        // We use the first shape as the primary ref for simplicity
        ref = makeShapeRef(groupShapes[0].id);

        if (shiftKey) {
          let nextRefs = [...selection.refs];
          for (const sRef of groupSelection.refs) {
            if (!nextRefs.some((r) => r.kind === sRef.kind && r.id === sRef.id)) {
              nextRefs.push(sRef);
            }
          }
          return { ref, nextSelection: toState(nextRefs, ref) };
        } else {
          return { ref, nextSelection: groupSelection };
        }
      }
    }
  }

  const nextSelection = shiftKey
    ? toggleSelection(selection, ref)
    : isSelected(selection, ref)
      ? selection
      : selectOnly(ref);

  return { ref, nextSelection };
}

export function resolveDragSelectionIds(params: {
  document: { shapes: SketchShape[] };
  ref: SketchSelectionRef;
  nextSelection: SelectionState;
}): string[] {
  const { document, ref, nextSelection } = params;

  if (ref.kind === "point") {
    return nextSelection.refs
      .filter((item) => item.kind === "point")
      .map((item) => item.id);
  }

  return getDragShapeIds(document as any, ref.id, nextSelection);
}

export function buildGroupShapeSelection(shapes: SketchShape[]): SelectionState {
  return {
    refs: shapes.map((shape) => makeShapeRef(shape.id)),
    primaryRef: shapes[0] ? makeShapeRef(shapes[0].id) : null,
    ids: shapes.map((shape) => shape.id),
    primaryId: shapes[0]?.id ?? null,
  };
}

export function getEntitiesInBox(
  document: { shapes: SketchShape[]; points: any[] },
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): SketchSelectionRef[] {
  const result: SketchSelectionRef[] = [];

  // Points
  for (const point of document.points) {
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
      result.push(makePointRef(point.id));
    }
  }

  // Shapes
  for (const shape of document.shapes) {
    const bounds = shapeBounds(shape, document.points);
    const intersects = !(
      bounds.maxX < minX ||
      bounds.minX > maxX ||
      bounds.maxY < minY ||
      bounds.minY > maxY
    );
    if (intersects) {
      result.push(makeShapeRef(shape.id));
    }
  }

  return result;
}
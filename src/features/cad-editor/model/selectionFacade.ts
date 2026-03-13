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

export function normalizeSelectionRef(rawId: string): SketchSelectionRef {
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
  let ref = normalizeSelectionRef(rawId);

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
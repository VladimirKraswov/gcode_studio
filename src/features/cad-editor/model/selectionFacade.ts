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

export function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_") || id.startsWith("pt-");
}

export function normalizeSelectionRef(rawId: string): SketchSelectionRef {
  return rawId.startsWith("point:")
    ? makePointRef(rawId.slice(6))
    : makeShapeRef(rawId);
}

export function resolveSelectionOnPointerDown(params: {
  selection: SelectionState;
  rawId: string;
  shiftKey: boolean;
}): {
  ref: SketchSelectionRef;
  nextSelection: SelectionState;
} {
  const { selection, rawId, shiftKey } = params;
  const ref = normalizeSelectionRef(rawId);

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
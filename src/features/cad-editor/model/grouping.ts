
// =============================
// FILE: src/modules/cad/model/grouping.ts
// =============================

import type { SketchDocument, SketchGroup, SketchShape } from "./types";
import type { SelectionState } from "./selection";
import { createId } from "./ids";

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export function getShapesByGroupId(
  document: SketchDocument,
  groupId: string | null,
): SketchShape[] {
  if (!groupId) return [];
  return document.shapes.filter((shape) => shape.groupId === groupId);
}

export function getGroupById(document: SketchDocument, groupId: string | null): SketchGroup | null {
  if (!groupId) return null;
  return document.groups.find((group) => group.id === groupId) ?? null;
}

export function getDragShapeIds(
  _document: SketchDocument,
  shapeId: string,
  selection: SelectionState,
): string[] {
  // If shapeId is already selected, drag the whole selection.
  // Otherwise, drag just the shapeId.
  // We no longer automatically drag the whole group.
  if (selection.ids.includes(shapeId)) {
    return selection.ids;
  }
  return [shapeId];
}

export function getGroupSelectionIds(document: SketchDocument, groupId: string): string[] {
  return document.shapes.filter((shape) => shape.groupId === groupId).map((shape) => shape.id);
}

export function groupSelectedShapes(
  document: SketchDocument,
  selection: SelectionState,
): SketchDocument {
  if (selection.ids.length < 2) {
    return document;
  }

  const groupId = createId("group");
  const ids = new Set(selection.ids);

  return {
    ...document,
    groups: [...document.groups, { id: groupId, name: `Группа ${document.groups.length + 1}`, collapsed: false }],
    shapes: document.shapes.map((shape) =>
      ids.has(shape.id) ? { ...shape, groupId } : shape,
    ),
  };
}

export function ungroupSelectedShapes(
  document: SketchDocument,
  selection: SelectionState,
): SketchDocument {
  if (selection.ids.length === 0) {
    return document;
  }

  const selected = document.shapes.filter((shape) => selection.ids.includes(shape.id));
  const groupIds = new Set(selected.map((shape) => shape.groupId).filter(Boolean));

  if (groupIds.size === 0) {
    return document;
  }

  return {
    ...document,
    groups: document.groups.filter((group) => !groupIds.has(group.id)),
    shapes: document.shapes.map((shape) =>
      groupIds.has(shape.groupId ?? "") ? { ...shape, groupId: null } : shape,
    ),
  };
}

export function renameGroup(document: SketchDocument, groupId: string, name: string): SketchDocument {
  return {
    ...document,
    groups: document.groups.map((group) =>
      group.id === groupId ? { ...group, name } : group,
    ),
  };
}

export function toggleGroupCollapsed(document: SketchDocument, groupId: string): SketchDocument {
  return {
    ...document,
    groups: document.groups.map((group) =>
      group.id === groupId ? { ...group, collapsed: !group.collapsed } : group,
    ),
  };
}

export function reorderShapes(document: SketchDocument, orderedIds: string[]): SketchDocument {
  const order = new Map(orderedIds.map((id, index) => [id, index]));
  const shapes = [...document.shapes].sort((a, b) => {
    const ai = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
  return { ...document, shapes };
}

export function collectVisibleShapes(document: SketchDocument): SketchShape[] {
  return document.shapes.filter((shape) => shape.visible !== false);
}

export function normalizeSelectionAfterDelete(
  document: SketchDocument,
  selection: SelectionState,
): SelectionState {
  const existing = new Set([
    ...document.shapes.map((shape) => shape.id),
    ...document.points.map((p) => p.id)
  ]);
  const ids = uniqueIds(selection.ids.filter((id) => existing.has(id)));
  return {
    ids,
    primaryId: ids.includes(selection.primaryId ?? "") ? selection.primaryId : (ids[0] ?? null),
  };
}

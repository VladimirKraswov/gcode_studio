import type { SketchPolylinePoint } from "../model/types";
import type { DragState } from "./draftState";
import type { DraftShape } from "../geometry/draftGeometry";

export function startRectangleDraft(x: number, y: number): DraftShape {
  return { type: "rectangle", startX: x, startY: y, endX: x, endY: y };
}

export function startCircleDraft(x: number, y: number): DraftShape {
  return { type: "circle", startX: x, startY: y, endX: x, endY: y };
}

export function startLineDraft(x: number, y: number): DraftShape {
  return { type: "line", startX: x, startY: y, endX: x, endY: y };
}

export function startArcRadiusDraft(x: number, y: number): DraftShape {
  return {
    type: "arc",
    stage: "radius",
    centerX: x,
    centerY: y,
    endX: x,
    endY: y,
    clockwise: false,
  };
}

export function updateDraft(draft: DraftShape, x: number, y: number): DraftShape {
  if (!draft) return null;

  if (draft.type === "arc") {
    if (draft.stage === "radius") {
      return { ...draft, endX: x, endY: y };
    }

    return { ...draft, endX: x, endY: y };
  }

  return { ...draft, endX: x, endY: y };
}

export function commitRectangleDraft(draft: DraftShape) {
  return draft?.type === "rectangle" ? draft : null;
}

export function startDrag(
  shapeId: string,
  x: number,
  y: number,
  selectionIds: string[],
): DragState {
  return {
    shapeId,
    startX: x,
    startY: y,
    selectionIds,
  };
}

export function updateDrag(drag: DragState, x: number, y: number) {
  if (!drag) return null;

  return {
    dx: x - drag.startX,
    dy: y - drag.startY,
    next: {
      shapeId: drag.shapeId,
      startX: x,
      startY: y,
      selectionIds: drag.selectionIds,
    } as DragState,
  };
}

export function finishDrag(): DragState {
  return null;
}

export function appendPolylinePoint(
  current: SketchPolylinePoint[],
  point: SketchPolylinePoint,
): SketchPolylinePoint[] {
  return [...current, point];
}

export function commitPolylineDraft(points: SketchPolylinePoint[]): SketchPolylinePoint[] {
  return points.length >= 2 ? points : [];
}

export function cancelDraft(): null {
  return null;
}
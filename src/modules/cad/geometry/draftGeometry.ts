import { distance } from "./distance";

export type RectangleDraft = {
  type: "rectangle";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type CircleDraft = {
  type: "circle";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type DraftShape = RectangleDraft | CircleDraft | null;

export function normalizeDraftRect(draft: RectangleDraft) {
  return {
    x: Math.min(draft.startX, draft.endX),
    y: Math.min(draft.startY, draft.endY),
    width: Math.abs(draft.endX - draft.startX),
    height: Math.abs(draft.endY - draft.startY),
  };
}

export function getRectangleFromDraft(draft: RectangleDraft) {
  return normalizeDraftRect(draft);
}

export function getCircleFromDraft(draft: CircleDraft) {
  return {
    cx: draft.startX,
    cy: draft.startY,
    radius: distance(
      { x: draft.startX, y: draft.startY },
      { x: draft.endX, y: draft.endY },
    ),
  };
}
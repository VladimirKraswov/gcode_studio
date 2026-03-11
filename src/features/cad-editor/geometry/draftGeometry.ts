import { distance } from "./distance";
import {
  angleDegFromCenter,
  sampleArcPoints,
} from "@/features/cad-editor/geometry/geometryEngine";
import type { SketchPolylinePoint } from "../model/types";

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

export type LineDraft = {
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type ArcRadiusDraft = {
  type: "arc";
  stage: "radius";
  centerX: number;
  centerY: number;
  endX: number;
  endY: number;
  clockwise: boolean;
};

export type ArcSweepDraft = {
  type: "arc";
  stage: "sweep";
  centerX: number;
  centerY: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  clockwise: boolean;
};

export type ArcDraft = ArcRadiusDraft | ArcSweepDraft;

export type DraftShape =
  | RectangleDraft
  | CircleDraft
  | LineDraft
  | ArcDraft
  | null;

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

export function getLineFromDraft(draft: LineDraft) {
  return {
    x1: draft.startX,
    y1: draft.startY,
    x2: draft.endX,
    y2: draft.endY,
  };
}

export function getArcFromDraft(draft: ArcDraft) {
  if (draft.stage !== "sweep") {
    return null;
  }

  const center = { x: draft.centerX, y: draft.centerY };
  const start = { x: draft.startX, y: draft.startY };
  const end = { x: draft.endX, y: draft.endY };

  const radius = distance(center, start);

  if (radius < 0.001) {
    return null;
  }

  return {
    cx: draft.centerX,
    cy: draft.centerY,
    radius,
    startAngle: angleDegFromCenter(center, start),
    endAngle: angleDegFromCenter(center, end),
    clockwise: draft.clockwise,
  };
}

export function getArcPreviewPoints(draft: ArcDraft) {
  if (draft.stage === "radius") {
    return [];
  }

  const arc = getArcFromDraft(draft);
  if (!arc) return [];

  return sampleArcPoints(
    { x: arc.cx, y: arc.cy },
    arc.radius,
    arc.startAngle,
    arc.endAngle,
    arc.clockwise,
    48,
  );
}

export function getPolylinePreviewPoints(
  points: SketchPolylinePoint[],
  hoverPoint: SketchPolylinePoint | null,
): SketchPolylinePoint[] {
  if (points.length === 0) {
    return [];
  }

  if (!hoverPoint) {
    return points;
  }

  const last = points[points.length - 1];
  if (
    Math.abs(last.x - hoverPoint.x) < 0.001 &&
    Math.abs(last.y - hoverPoint.y) < 0.001
  ) {
    return points;
  }

  return [...points, hoverPoint];
}
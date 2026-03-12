import { type SketchTool } from "../model/types";
import { type DraftShape } from "../geometry/draftGeometry";

export type ArrayToolMode = "linear" | "circular" | null;

export interface ArrayToolState {
  mode: ArrayToolMode;
  linear: {
    count: number;
    spacing: number;
    axis: string;
    direction: "positive" | "negative" | "both";
  };
  circular: {
    count: number;
    centerX: number | string;
    centerY: number | string;
    radius: number;
    startAngle: number;
    endAngle: number;
    totalAngle: number;
    rotateItems: boolean;
    direction: "cw" | "ccw";
  };
  editingGroupId: string | null;
}

export interface PanState {
  pointerId: number;
  button: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  clearSelectionOnPointerUp: boolean;
  moved: boolean;
}

export interface DragState {
  shapeId: string;
  startX: number;
  startY: number;
  selectionIds: string[];
  dx?: number;
  dy?: number;
  next?: DragState;
}

export interface TextToolState {
  text: string;
  height: number;
  letterSpacing: number;
  fontFile: string;
}

export interface CadEditorState {
  tool: SketchTool;
  draft: DraftShape;
  polylineDraft: any[];
  polylineHoverPoint: any | null;
  textTool: TextToolState;
  isGenerating: boolean;
  dragState: DragState | null;
  panState: PanState | null;
  isSelectionHover: boolean;
  arrayTool: ArrayToolState;
}

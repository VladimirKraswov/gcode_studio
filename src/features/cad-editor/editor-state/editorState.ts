import type { SketchPolylinePoint, SketchTool } from "../model/types";
import type { DraftShape } from "../geometry/draftGeometry";
import type { TextToolState } from "./textToolState";
import type { DragState } from "./draftState";
import type { ViewTransform } from "../model/view";
import { createDefaultView } from "../model/view";

export type CadEditorState = {
  tool: SketchTool;
  draft: DraftShape;
  polylineDraft: SketchPolylinePoint[];
  dragState: DragState;
  view: ViewTransform;
  textTool: TextToolState;
};

export { createDefaultView };
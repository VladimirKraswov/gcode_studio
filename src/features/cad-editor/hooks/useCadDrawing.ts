import { useState, useCallback } from "react";
import type { DraftShape } from "../geometry/draftGeometry";
import type { SketchPolylinePoint, SketchTool, SketchDocument } from "../model/types";
import { createDefaultTextToolState } from "../editor-state/textToolState";
import type { TextToolState } from "./types";

export function useCadDrawing(_document: SketchDocument) {
  const [tool, setToolState] = useState<SketchTool>("select");
  const [draft, setDraft] = useState<DraftShape>(null);
  const [polylineDraft, setPolylineDraft] = useState<SketchPolylinePoint[]>([]);
  const [polylineHoverPoint, setPolylineHoverPoint] = useState<SketchPolylinePoint | null>(null);
  const [textTool, setTextTool] = useState<TextToolState>(createDefaultTextToolState());

  const resetDrafts = useCallback(() => {
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
  }, []);

  const setTool = useCallback((nextTool: SketchTool, onClearSelection: () => void) => {
    setToolState(nextTool);
    if (nextTool !== "select") {
      onClearSelection();
    }
  }, []);

  return {
    tool,
    setTool,
    draft,
    setDraft,
    polylineDraft,
    setPolylineDraft,
    polylineHoverPoint,
    setPolylineHoverPoint,
    textTool,
    setTextTool,
    resetDrafts,
  };
}

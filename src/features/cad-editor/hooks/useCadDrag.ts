import { useState, useCallback } from "react";
import type { SketchDocument, SketchPolylinePoint } from "../model/types";
import { updateDrag, finishDrag } from "../editor-state/commands";
import { isPointSelectionId } from "../model/selectionFacade";
import { movePointsAndSolve } from "../model/solver/manager";
import { collectDraggedPointIds } from "../model/editorFacade";
import type { DragState } from "./types";

interface UseCadDragParams {
  document: SketchDocument;
  setDocumentSilently: React.Dispatch<React.SetStateAction<SketchDocument>>;
}

export function useCadDrag({
  document,
  setDocumentSilently,
}: UseCadDragParams) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleDrag = useCallback((cad: SketchPolylinePoint) => {
    if (!dragState) return;

    const next = updateDrag(dragState as any, cad.x, cad.y);
    if (!next) return;

    if (dragState.shapeId.startsWith("point:")) {
      const activePointId = dragState.shapeId.split(":")[1];

      const pointIds = new Set(
        dragState.selectionIds.length > 0
          ? dragState.selectionIds.filter((id) => isPointSelectionId(id))
          : [activePointId],
      );

      setDocumentSilently((prev) => movePointsAndSolve(prev, pointIds, next.dx, next.dy));
      setDragState(next.next as any);
      return;
    }

    const selectedIds =
      dragState.selectionIds.length > 0
        ? dragState.selectionIds
        : [dragState.shapeId];

    const { affectedPointIds, nonParametricShapeIds } = collectDraggedPointIds(
      document,
      selectedIds,
    );

    setDocumentSilently((prev) => {
      let nextDoc = movePointsAndSolve(prev, affectedPointIds, next.dx, next.dy);

      if (nonParametricShapeIds.size > 0) {
        nextDoc = {
          ...nextDoc,
          shapes: nextDoc.shapes.map((shape) => {
            if (nonParametricShapeIds.has(shape.id)) {
              return {
                ...shape,
                x: (shape as any).x + next.dx,
                y: (shape as any).y + next.dy,
              } as any;
            }
            return shape;
          }),
        };
      }

      return nextDoc;
    });

    setDragState(next.next as any);
  }, [dragState, document, setDocumentSilently]);

  const endDrag = useCallback(() => {
    setDragState(finishDrag());
  }, []);

  return {
    dragState,
    setDragState,
    handleDrag,
    endDrag,
  };
}

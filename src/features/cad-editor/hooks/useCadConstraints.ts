import { useCallback } from "react";
import type { SketchDocument, SketchConstraintType } from "../model/types";
import type { SelectionState } from "../model/selection";
import { clearSelection, makeConstraintRef, selectOnly } from "../model/selection";
import { addConstraint, removeConstraint } from "../model/constraints";
import { updateGeometry } from "../model/solver/manager";
import { createQuickConstraintFromSelection } from "../model/constraintFacade";

interface UseCadConstraintsParams {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
  onSelectionChangeSilently: (selection: SelectionState) => void;
  checkpointHistory: () => void;
  bindSelectStart: (event: React.PointerEvent<SVGElement>, rawId: string) => void;
}

export function useCadConstraints({
  document,
  setDocument,
  selection,
  onSelectionChangeSilently,
  checkpointHistory,
  bindSelectStart,
}: UseCadConstraintsParams) {
  const addQuickConstraint = useCallback((type: SketchConstraintType) => {
    const constraint = createQuickConstraintFromSelection({
      document,
      selection,
      type
    });
    if (!constraint) return;

    checkpointHistory();
    setDocument(addConstraint(document, constraint));
  }, [document, selection, checkpointHistory, setDocument]);

  const onConstraintPointerDown = useCallback((event: React.PointerEvent, id: string) => {
    event.stopPropagation();

    if (id.startsWith("point:")) {
      const pointId = id.split(":")[1];
      bindSelectStart(event as any, `point:${pointId}`);
      return;
    }

    onSelectionChangeSilently(selectOnly(makeConstraintRef(id)));
  }, [bindSelectStart, onSelectionChangeSilently]);

  const updateConstraintValue = useCallback((constraintId: string, value: number) => {
    if (!Number.isFinite(value)) return;

    checkpointHistory();
    setDocument((prev) =>
      updateGeometry({
        ...prev,
        constraints: prev.constraints.map((constraint) =>
          constraint.id === constraintId
            ? { ...constraint, value }
            : constraint,
        ),
      }),
    );
  }, [checkpointHistory, setDocument]);

  const deleteConstraintById = useCallback((constraintId: string) => {
    checkpointHistory();
    setDocument((prev) => updateGeometry(removeConstraint(prev, constraintId)));
    onSelectionChangeSilently(clearSelection());
  }, [checkpointHistory, setDocument, onSelectionChangeSilently]);

  return {
    addQuickConstraint,
    onConstraintPointerDown,
    updateConstraintValue,
    deleteConstraintById,
  };
}

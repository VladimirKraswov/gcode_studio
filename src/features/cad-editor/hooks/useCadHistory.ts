import { useCallback, useMemo } from "react";

interface CadHistoryHookParams {
  checkpointHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useCadHistory({
  checkpointHistory,
  undo,
  redo,
  canUndo,
  canRedo,
}: CadHistoryHookParams) {
  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  return useMemo(() => ({
    checkpointHistory,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  }), [checkpointHistory, handleUndo, handleRedo, canUndo, canRedo]);
}

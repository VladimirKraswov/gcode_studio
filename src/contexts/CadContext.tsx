import { createContext, useContext, type ReactNode } from "react";
import type { SketchDocument, SelectionState, ViewTransform } from "@/features/cad-editor";
import { type CameraInfo } from "@/types/gcode";

export interface CadContextValue {
  editDocument: SketchDocument;
  setEditDocument: (update: React.SetStateAction<SketchDocument>) => void;
  setEditDocumentSilently: (update: React.SetStateAction<SketchDocument>) => void;
  selection: SelectionState;
  setSelection: (selection: SelectionState) => void;
  setSelectionSilently: (selection: SelectionState) => void;
  cadView: ViewTransform;
  setCadView: (update: React.SetStateAction<ViewTransform>) => void;
  setCadViewSilently: (update: React.SetStateAction<ViewTransform>) => void;
  checkpointHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Scene settings
  cameraResetKey: number;
  setCameraResetKey: (key: React.SetStateAction<number>) => void;
  cameraInfo: CameraInfo;
  setCameraInfo: (info: CameraInfo) => void;
  resetCamera: () => void;

  // Editor methods (bridged from useCadEditor)
  cadEditor: {
    insertControlPointToSelectedBSpline: (x: number, y: number) => void;
    removeSelectedPointFromBSpline: () => void;
  } | null;
  setCadEditor: (editor: {
    insertControlPointToSelectedBSpline: (x: number, y: number) => void;
    removeSelectedPointFromBSpline: () => void;
  } | null) => void;
<<<<<<< HEAD
<<<<<<< HEAD
  deleteConstraintById: (id: string) => void;
=======
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
=======
  deleteConstraintById: (id: string) => void;
>>>>>>> 602697f (Refactoring)
}

export const CadContext = createContext<CadContextValue | undefined>(undefined);

export function CadProvider({ children, value }: { children: ReactNode; value: CadContextValue }) {
  return <CadContext.Provider value={value}>{children}</CadContext.Provider>;
}

export function useCad() {
  const context = useContext(CadContext);
  if (context === undefined) {
    throw new Error("useCad must be used within a CadProvider");
  }
  return context;
}

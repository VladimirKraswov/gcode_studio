// src/hooks/useAppState.ts
import { useState, useMemo, useCallback } from "react";
import { DEMO_GCODE } from "@/constants/demo";
import { useGCodeWorker } from "@/features/gcode-editor/hooks/useGCodeWorker";
import { usePlayback } from "@/features/preview/hooks/usePlayback";
import { useCurrentState } from "@/features/preview/hooks/useCurrentState";
import { useUndoRedo } from "@/shared/hooks/useUndoRedo";
import { loadSettings, saveSettings, type UserSettings } from "@/shared/utils/settings";
import type { PlacementMode, StockDimensions } from "@/types/gcode";
import type { MainTab } from "@/types/ui";
import type { GCodeStudioProject } from "@/types/project";
import { createEmptySketchDocument } from "@/features/cad-editor/model/document";
import { createSelection } from "@/features/cad-editor/model/selection";
import { createDefaultView } from "@/features/cad-editor/model/view";
import { updateGeometry } from "@/features/cad-editor/model/solver/manager";
import { useGCodeFile } from "@/features/gcode-editor/hooks/useGCodeFile";
import { useSceneState } from "@/features/preview/hooks/useSceneState";
import type { SketchDocument } from "@/features/cad-editor";
import type { UIContextValue } from "@/contexts/UIContext";
import type { SettingsContextValue } from "@/contexts/SettingsContext";
import type { GCodeContextValue } from "@/contexts/GCodeContext";
import type { CadContextValue } from "@/contexts/CadContext";

const UNDO_HISTORY_LIMIT = 10;
const DEFAULT_STOCK: StockDimensions = { width: 300, height: 180, thickness: 3 };

type HistoryCadState = Pick<GCodeStudioProject, "editDocument" | "selection" | "cadView">;

export function useAppState() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<MainTab>("view");
  const [hint, setHint] = useState("");

  const ui: UIContextValue = useMemo(() => ({
    activeTab,
    setActiveTab,
    hint,
    setHint,
  }), [activeTab, hint]);

  // --- Settings State ---
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  const updateSettings = useCallback((update: UserSettings | ((prev: UserSettings) => UserSettings)) => {
    setSettings(prev => {
      const next = typeof update === "function" ? update(prev) : update;
      saveSettings(next);
      return next;
    });
  }, []);

  const settingsValue: SettingsContextValue = useMemo(() => ({
    settings,
    updateSettings,
  }), [settings, updateSettings]);

  // --- G-Code State ---
  const [source, setSource] = useState(DEMO_GCODE);
  const [fileName, setFileName] = useState("demo.gcode");
  const [stock, setStock] = useState<StockDimensions>(DEFAULT_STOCK);
  const [showMaterialRemoval, setShowMaterialRemoval] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("origin");
  const [detailLevel, setDetailLevel] = useState(5);

  const { cameraResetKey, setCameraResetKey, cameraInfo, setCameraInfo, resetCamera } = useSceneState();

  const { applyGeneratedGCode, handleFileChange } = useGCodeFile(
    setSource,
    setFileName,
    setActiveTab,
    setCameraResetKey
  );

  const { parsed, isParsing } = useGCodeWorker(source);
  const { progress, setProgress, playing, setPlaying, speed, setSpeed, resetPlayback } = usePlayback();
  const currentState = useCurrentState(parsed, progress);

  const gcode: GCodeContextValue = useMemo(() => ({
    source, setSource,
    fileName, setFileName,
    parsed, isParsing,
    progress, setProgress,
    playing, setPlaying,
    speed, setSpeed,
    resetPlayback,
    currentState: currentState as any,
    stock, setStock,
    showMaterialRemoval, setShowMaterialRemoval,
    placementMode, setPlacementMode,
    detailLevel, setDetailLevel,
    applyGeneratedGCode,
    handleFileChange,
  }), [
    source, fileName, parsed, isParsing, progress, playing, speed, currentState, stock,
    showMaterialRemoval, placementMode, detailLevel, applyGeneratedGCode, handleFileChange, resetPlayback
  ]);

  // --- CAD State ---
  const initialCadState = useMemo<HistoryCadState>(() => ({
    editDocument: createEmptySketchDocument(),
    selection: createSelection(),
    cadView: createDefaultView(),
  }), []);

  const { state: cadHistoryState, setState: setCadHistoryState, checkpoint: checkpointHistory, undo, redo, canUndo, canRedo } =
    useUndoRedo<HistoryCadState>(initialCadState, UNDO_HISTORY_LIMIT);

  const { editDocument, selection, cadView } = cadHistoryState;

  const [cadEditor, setCadEditor] = useState<{
    insertControlPointToSelectedBSpline: (x: number, y: number) => void;
    removeSelectedPointFromBSpline: () => void;
  } | null>(null);

  const updateCadField = useCallback(<K extends keyof HistoryCadState>(
    key: K,
    update: React.SetStateAction<HistoryCadState[K]>,
    options?: { record?: boolean }
  ) => {
    setCadHistoryState(prev => {
      const nextValue = typeof update === "function"
        ? (update as (value: HistoryCadState[K]) => HistoryCadState[K])(prev[key])
        : update;

      if (key === "editDocument") {
        return { ...prev, [key]: updateGeometry(nextValue as SketchDocument) };
      }
      return { ...prev, [key]: nextValue };
    }, options);
  }, [setCadHistoryState]);

  const setEditDocument = useCallback((update: React.SetStateAction<typeof editDocument>) =>
    updateCadField("editDocument", update), [updateCadField]);

  const setEditDocumentSilently = useCallback((update: React.SetStateAction<typeof editDocument>) =>
    updateCadField("editDocument", update, { record: false }), [updateCadField]);

  const setSelection = useCallback((next: typeof selection) =>
    updateCadField("selection", next), [updateCadField]);

  const setSelectionSilently = useCallback((next: typeof selection) =>
    updateCadField("selection", next, { record: false }), [updateCadField]);

  const setCadView = useCallback((update: React.SetStateAction<typeof cadView>) =>
    updateCadField("cadView", update), [updateCadField]);

  const setCadViewSilently = useCallback((update: React.SetStateAction<typeof cadView>) =>
    updateCadField("cadView", update, { record: false }), [updateCadField]);

  const cad: CadContextValue = useMemo(() => ({
    editDocument, setEditDocument, setEditDocumentSilently,
    selection, setSelection, setSelectionSilently,
    cadView, setCadView, setCadViewSilently,
    checkpointHistory,
    undo, redo, canUndo, canRedo,
    cameraResetKey, setCameraResetKey,
    cameraInfo: cameraInfo as any,
    setCameraInfo: setCameraInfo as any,
    resetCamera,
    cadEditor,
    setCadEditor,
    deleteConstraintById: (id: string) => {
        setEditDocument((prev) => updateGeometry({
            ...prev,
            constraints: prev.constraints.filter((c) => c.id !== id),
        }));
    },
  }), [
    editDocument, setEditDocument, setEditDocumentSilently,
    selection, setSelection, setSelectionSilently,
    cadView, setCadView, setCadViewSilently,
    checkpointHistory, undo, redo, canUndo, canRedo,
    cameraResetKey, setCameraResetKey, cameraInfo, setCameraInfo,
    resetCamera, cadEditor, setCadEditor
  ]);

  return {
    ui,
    settings: settingsValue,
    gcode,
    cad
  };
}

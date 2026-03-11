// src/hooks/useAppState.ts
import { useState, useMemo } from "react";
import { DEMO_GCODE } from "@/constants/demo";
import { useGCodeWorker } from "@/features/gcode-editor/hooks/useGCodeWorker";
import { usePlayback } from "@/features/preview/hooks/usePlayback";
import { useCurrentState } from "@/features/preview/hooks/useCurrentState";
import { useUndoRedo } from "@/shared/hooks/useUndoRedo";
import { loadSettings, saveSettings } from "@/shared/utils/settings";
import type { PlacementMode, StockDimensions } from "@/types/gcode";
import type { MainTab } from "@/types/ui";
import type { GCodeStudioProject } from "@/types/project";
import { createEmptySketchDocument } from "@/features/cad-editor/model/document";
import { createSelection } from "@/features/cad-editor/model/selection";
import { createDefaultView } from "@/features/cad-editor/model/view";
import { updateGeometry } from "@/features/cad-editor/model/solver/manager";
import { useGCodeFile } from "@/features/gcode-editor/hooks/useGCodeFile";
import { useSceneState } from "@/features/preview/hooks/useSceneState";

const UNDO_HISTORY_LIMIT = 10;
const DEFAULT_STOCK: StockDimensions = { width: 300, height: 180, thickness: 3 };

type HistoryCadState = Pick<GCodeStudioProject, "editDocument" | "selection" | "cadView">;

export function useAppState() {
  // Основные состояния
  const [source, setSource] = useState(DEMO_GCODE);
  const [fileName, setFileName] = useState("demo.gcode");
  const [stock, setStock] = useState<StockDimensions>(DEFAULT_STOCK);
  const [showMaterialRemoval, setShowMaterialRemoval] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("origin");
  const [detailLevel, setDetailLevel] = useState(5);
  const [activeTab, setActiveTab] = useState<MainTab>("view");
  const [settings, setSettings] = useState(() => loadSettings());

  const updateSettings = (update: typeof settings | ((prev: typeof settings) => typeof settings)) => {
    setSettings(prev => {
      const next = typeof update === "function" ? (update as any)(prev) : update;
      saveSettings(next);
      return next;
    });
  };

  const {
    cameraResetKey,
    setCameraResetKey,
    cameraInfo,
    setCameraInfo,
    resetCamera
  } = useSceneState();

  const { applyGeneratedGCode, handleFileChange } = useGCodeFile(
    setSource,
    setFileName,
    setActiveTab,
    setCameraResetKey
  );

  // CAD состояние с undo/redo
  const initialCadState = useMemo<HistoryCadState>(() => ({
    editDocument: createEmptySketchDocument(),
    selection: createSelection(),
    cadView: createDefaultView(),
  }), []);

  const { state: cadHistoryState, setState: setCadHistoryState, checkpoint: checkpointHistory, undo, redo, canUndo, canRedo } =
    useUndoRedo<HistoryCadState>(initialCadState, UNDO_HISTORY_LIMIT);

  const { editDocument, selection, cadView } = cadHistoryState;

  // Вспомогательная функция для обновления полей CAD
  const updateCadField = <K extends keyof HistoryCadState>(
    key: K,
    update: React.SetStateAction<HistoryCadState[K]>,
    options?: { record?: boolean }
  ) => {
    setCadHistoryState(prev => {
      const nextValue = typeof update === "function" ? (update as (value: any) => any)(prev[key]) : update;
      if (key === "editDocument") {
        return { ...prev, [key]: updateGeometry(nextValue as any) };
      }
      return { ...prev, [key]: nextValue };
    }, options);
  };

  const setEditDocument = (update: React.SetStateAction<typeof editDocument>) => updateCadField("editDocument", update);
  const setEditDocumentSilently = (update: React.SetStateAction<typeof editDocument>) => updateCadField("editDocument", update, { record: false });
  const setSelection = (next: typeof selection) => updateCadField("selection", next);
  const setSelectionSilently = (next: typeof selection) => updateCadField("selection", next, { record: false });
  const setCadView = (update: React.SetStateAction<typeof cadView>) => updateCadField("cadView", update);
  const setCadViewSilently = (update: React.SetStateAction<typeof cadView>) => updateCadField("cadView", update, { record: false });

  // G-code парсинг и воспроизведение
  const { parsed, isParsing } = useGCodeWorker(source);
  const { progress, setProgress, playing, setPlaying, speed, setSpeed, resetPlayback } = usePlayback();
  const currentState = useCurrentState(parsed, progress);

  return {
    // G-code данные
    source, setSource,
    fileName, setFileName,
    parsed, isParsing,
    progress, setProgress,
    playing, setPlaying,
    speed, setSpeed,
    resetPlayback,
    currentState,

    // CAD данные
    editDocument, setEditDocument, setEditDocumentSilently,
    selection, setSelection, setSelectionSilently,
    cadView, setCadView, setCadViewSilently,
    checkpointHistory,
    undo, redo, canUndo, canRedo,

    // Настройки сцены
    stock, setStock,
    showMaterialRemoval, setShowMaterialRemoval,
    placementMode, setPlacementMode,
    detailLevel, setDetailLevel,
    cameraResetKey, setCameraResetKey,
    cameraInfo, setCameraInfo,
    resetCamera,

    // Настройки пользователя
    settings, updateSettings,

    // UI состояние
    activeTab, setActiveTab,

    applyGeneratedGCode,
    handleFileChange,
  };
}

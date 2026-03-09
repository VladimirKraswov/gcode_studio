// src/hooks/useAppState.ts
import { useState, useMemo, useCallback } from "react";
import { DEMO_GCODE } from "../constants/demo";
import { useGCodeWorker } from "./useGCodeWorker";
import { usePlayback } from "./usePlayback";
import { useCurrentState } from "./useCurrentState";
import { useUndoRedo } from "./useUndoRedo";
import { loadSettings, saveSettings } from "../utils/settings";
import type { CameraInfo, PlacementMode, StockDimensions } from "../types/gcode";
import type { MainTab } from "../types/ui";
import type { GCodeStudioProject } from "../types/project";
import { createEmptySketchDocument } from "../modules/cad/model/document";
import { createSelection } from "../modules/cad/model/selection";
import { createDefaultView } from "../modules/cad/model/view";
import { applyDistanceConstraints } from "../modules/cad/model/constraints";

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
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const [settings, setSettings] = useState(() => loadSettings());

  const updateSettings = (update: typeof settings | ((prev: typeof settings) => typeof settings)) => {
    setSettings(prev => {
      const next = typeof update === "function" ? update(prev) : update;
      saveSettings(next);
      return next;
    });
  };

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
        return { ...prev, [key]: applyDistanceConstraints(nextValue as any).document };
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

  const applyGeneratedGCode = useCallback((gcode: string) => {
    setSource(gcode);
    setFileName("edit-generated.gcode");
    setActiveTab("gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
  }, [setSource, setFileName, setActiveTab, resetPlayback, setCameraResetKey]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSource(text || "");
    setFileName(file.name || "loaded.gcode");
    resetPlayback();
    setCameraResetKey((v) => v + 1);
  }, [setSource, setFileName, resetPlayback, setCameraResetKey]);

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

    // Настройки пользователя
    settings, updateSettings,

    // UI состояние
    activeTab, setActiveTab,

    applyGeneratedGCode,
    handleFileChange,
  };
}
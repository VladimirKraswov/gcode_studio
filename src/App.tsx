import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  FiBox,
  FiCode,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiEye,
  FiLoader,
  FiTool,
} from "react-icons/fi";
import type { CameraInfo, PlacementMode, StockDimensions } from "./types/gcode";
import type { MainTab } from "./types/ui";
import { DEMO_GCODE } from "./constants/demo";
import { EditTab } from "./components/EditTab";
import { GCodeEditorPanel } from "./components/GCodeEditorPanel";
import { GCodeRightPanel } from "./components/GCodeRightPanel";
import { LeftPanel } from "./components/LeftPanel";
import { MainTabs } from "./components/MainTabs";
import { PathScene } from "./components/PathScene";
import { RightInfoPanel } from "./components/RightInfoPanel";
import { EditRightPanel } from "./components/EditRightPanel";
import { useCurrentState } from "./hooks/useCurrentState";
import { useGCodeWorker } from "./hooks/useGCodeWorker";
import { usePlayback } from "./hooks/usePlayback";
import type { SketchDocument } from "./modules/cad/model/types";
import type { SelectionState } from "./modules/cad/model/selection";
import { createSelection } from "./modules/cad/model/selection";
import { createEmptySketchDocument } from "./modules/cad/model/document";
import { theme, ui } from "./styles/ui";
import { downloadTextFile } from "./utils";
import { parseProjectFile, createProjectFile } from "./utils/projectFile";
import type { ViewTransform } from "./modules/cad/model/view";
import { createDefaultView } from "./modules/cad/model/view";
import { useUndoRedo } from "./hooks/useUndoRedo";
import type { GCodeStudioProject } from "./types/project";

const UNDO_HISTORY_LIMIT = 10;

type HistoryCadState = Pick<
  GCodeStudioProject,
  "editDocument" | "selection" | "cadView"
>;

const DEFAULT_STOCK: StockDimensions = {
  width: 300,
  height: 180,
  thickness: 3,
};

const TAB_META: Record<
  MainTab,
  { title: string; icon: React.ReactNode; subtitle: string }
> = {
  view: {
    title: "3D-превью",
    subtitle: "Просмотр траектории, заготовки и хода инструмента",
    icon: <FiEye size={18} />,
  },
  gcode: {
    title: "G-code",
    subtitle: "Редактирование, вставка команд и быстрый экспорт",
    icon: <FiCode size={18} />,
  },
  edit: {
    title: "Конструктор",
    subtitle: "Создание геометрии и генерация G-code",
    icon: <FiTool size={18} />,
  },
};

export default function App() {
  const [source, setSource] = useState(DEMO_GCODE);
  const [fileName, setFileName] = useState("demo.gcode");
  const [stock, setStock] = useState<StockDimensions>(DEFAULT_STOCK);
  const [showMaterialRemoval, setShowMaterialRemoval] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("origin");
  const [detailLevel, setDetailLevel] = useState(5);
  const [activeTab, setActiveTab] = useState<MainTab>("view");
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);

  const initialCadState = useMemo<HistoryCadState>(
    () => ({
      editDocument: createEmptySketchDocument(),
      selection: createSelection(),
      cadView: createDefaultView(),
    }),
    [],
  );

  const {
    state: cadHistoryState,
    setState: setCadHistoryState,
    checkpoint: checkpointHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<HistoryCadState>(initialCadState, UNDO_HISTORY_LIMIT);

  const { editDocument, selection, cadView } = cadHistoryState;

  function resolveUpdate<T>(update: SetStateAction<T>, prev: T): T {
    return typeof update === "function"
      ? (update as (value: T) => T)(prev)
      : update;
  }

  function updateCadField<K extends keyof HistoryCadState>(
    key: K,
    update: SetStateAction<HistoryCadState[K]>,
    options?: { record?: boolean },
  ) {
    setCadHistoryState(
      (prev) => ({
        ...prev,
        [key]: resolveUpdate(update, prev[key]),
      }),
      options,
    );
  }

  const setEditDocument: Dispatch<SetStateAction<SketchDocument>> = (update) =>
    updateCadField("editDocument", update);

  const setEditDocumentSilently: Dispatch<SetStateAction<SketchDocument>> = (
    update,
  ) => updateCadField("editDocument", update, { record: false });

  const setSelection = (next: SelectionState) =>
    updateCadField("selection", next);

  const setSelectionSilently = (next: SelectionState) =>
    updateCadField("selection", next, { record: false });

  const setCadView: Dispatch<SetStateAction<ViewTransform>> = (update) =>
    updateCadField("cadView", update);

  const setCadViewSilently: Dispatch<SetStateAction<ViewTransform>> = (update) =>
    updateCadField("cadView", update, { record: false });

  const { parsed, isParsing } = useGCodeWorker(source);
  const {
    progress,
    setProgress,
    playing,
    setPlaying,
    speed,
    setSpeed,
    resetPlayback,
  } = usePlayback();

  const currentState = useCurrentState(parsed, progress);
  const tabMeta = TAB_META[activeTab];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  function applyGeneratedGCodeFromEdit(gcode: string) {
    setSource(gcode);
    setFileName("edit-generated.gcode");
    setActiveTab("gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
  }

  function saveProject() {
    const project = {
      version: 2 as const,
      kind: "gcode-studio-project" as const,
      fileName,
      source,
      stock,
      showMaterialRemoval,
      placementMode,
      detailLevel,
      activeTab,
      editDocument,
      selection,
      cadView,
    };

    const outputName = fileName.replace(/\.(gcode|nc|tap|txt|gs)$/i, "") + ".gs";
    downloadTextFile(createProjectFile(project), outputName);
  }

  async function handleProjectFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project = parseProjectFile(text);

      setFileName(project.fileName || "project.gcode");
      setSource(project.source || "");
      setStock(project.stock);
      setShowMaterialRemoval(project.showMaterialRemoval);
      setPlacementMode(project.placementMode);
      setDetailLevel(project.detailLevel);
      setActiveTab(project.activeTab);

      setCadHistoryState({
        editDocument: project.editDocument,
        selection: project.selection,
        cadView: project.cadView,
      });

      resetPlayback();
      setCameraResetKey((value) => value + 1);
    } catch (error) {
      console.error(error);
      alert("Не удалось загрузить файл проекта .gs");
    } finally {
      event.target.value = "";
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setSource(text || "");
    setFileName(file.name || "loaded.gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
  }

  function loadDemo() {
    setSource(DEMO_GCODE);
    setFileName("demo.gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
  }

  if (!parsed || isParsing) {
    return (
      <div style={ui.appShell}>
        <div
          style={{
            height: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              ...ui.panel,
              width: "min(520px, 100%)",
              padding: 28,
              textAlign: "center",
              background: theme.panelSolid,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 18px",
                borderRadius: 24,
                display: "grid",
                placeItems: "center",
                background: theme.primarySoft,
                color: theme.primary,
              }}
            >
              <FiLoader size={34} style={{ animation: "spin 1s linear infinite" }} />
            </div>

            <h1 style={{ margin: 0, fontSize: 28 }}>GCode Studio</h1>
            <p style={{ color: theme.textMuted, margin: "10px 0 18px" }}>
              {isParsing
                ? "Парсинг G-code... Это может занять несколько секунд."
                : "Загрузите файл, чтобы начать работу."}
            </p>

            {!isParsing && (
              <input
                type="file"
                accept=".gcode,.nc,.tap,.txt"
                onChange={handleFileChange}
                style={ui.input}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ui.appShell}>
      <div style={ui.page}>
        <div
          style={{
            ...ui.pageGrid,
            height: "100%",
            minHeight: 0,
          }}
        >
          <div
            style={{
              ...ui.column,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="scrollbar-thin"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: 4,
              }}
            >
              <LeftPanel
                fileName={fileName}
                onFileChange={handleFileChange}
                onProjectFileChange={handleProjectFileChange}
                onSaveProject={saveProject}
                onLoadDemo={loadDemo}
                onResetCamera={() => setCameraResetKey((v) => v + 1)}
                playing={playing}
                onPlayPause={() => setPlaying((v) => !v)}
                onResetPlayback={resetPlayback}
                progress={progress}
                onProgressChange={setProgress}
                speed={speed}
                onSpeedChange={setSpeed}
                placementMode={placementMode}
                onPlacementModeChange={setPlacementMode}
                stock={stock}
                onStockChange={setStock}
                showMaterialRemoval={showMaterialRemoval}
                onShowMaterialRemovalChange={setShowMaterialRemoval}
                detailLevel={detailLevel}
                onDetailLevelChange={setDetailLevel}
              />
            </div>
          </div>

          <div
            style={{
              ...ui.column,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...ui.panel,
                padding: 18,
                background: theme.panelSolid,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={ui.iconBadge}>{tabMeta.icon}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{tabMeta.title}</div>
                    <div style={ui.sectionSubtle}>{tabMeta.subtitle}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Отменить (Ctrl/Cmd+Z)"
                    style={{
                      ...ui.buttonGhost,
                      width: 38,
                      height: 38,
                      padding: 0,
                      opacity: canUndo ? 1 : 0.45,
                      cursor: canUndo ? "pointer" : "not-allowed",
                    }}
                  >
                    <FiCornerUpLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Повторить (Ctrl/Cmd+Shift+Z / Ctrl+Y)"
                    style={{
                      ...ui.buttonGhost,
                      width: 38,
                      height: 38,
                      padding: 0,
                      opacity: canRedo ? 1 : 0.45,
                      cursor: canRedo ? "pointer" : "not-allowed",
                    }}
                  >
                    <FiCornerUpRight size={16} />
                  </button>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 700,
                      maxWidth: "100%",
                    }}
                  >
                    <FiBox size={14} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fileName}
                    </span>
                  </div>
                </div>
              </div>

              <MainTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            <div
              className="fade-in"
              style={{
                ...ui.panel,
                flex: 1,
                minHeight: 0,
                padding: 16,
                background: theme.panelSolid,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {activeTab === "view" && (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: theme.panelMuted,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      fontSize: 12,
                      color: theme.textMuted,
                      flexShrink: 0,
                    }}
                  >
                    <span>ЛКМ/ПКМ — панорама, колесо — масштаб</span>
                    <span>Machine zero: X0 Y0 Z0</span>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      borderRadius: 18,
                      border: `1px solid ${theme.border}`,
                      background: "#f8fafc",
                    }}
                  >
                    <PathScene
                      parsed={parsed}
                      currentState={currentState}
                      progress={progress}
                      cameraResetKey={cameraResetKey}
                      stock={stock}
                      showMaterialRemoval={showMaterialRemoval}
                      totalLength={parsed.totalLength}
                      placementMode={placementMode}
                      detailLevel={detailLevel}
                      onCameraUpdate={setCameraInfo}
                    />
                  </div>
                </div>
              )}

              {activeTab === "gcode" && (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <GCodeEditorPanel
                    source={source}
                    setSource={setSource}
                    fileName={fileName}
                  />
                </div>
              )}

              {activeTab === "edit" && (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <EditTab
                    document={editDocument}
                    setDocument={setEditDocument}
                    setDocumentSilently={setEditDocumentSilently}
                    onGenerateGCode={applyGeneratedGCodeFromEdit}
                    selection={selection}
                    onSelectionChange={setSelection}
                    onSelectionChangeSilently={setSelectionSilently}
                    view={cadView}
                    onViewChange={setCadView}
                    onViewChangeSilently={setCadViewSilently}
                    checkpointHistory={checkpointHistory}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              ...ui.column,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="scrollbar-thin fade-in"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: 4,
              }}
            >
              {activeTab === "view" && (
                <RightInfoPanel
                  bounds={parsed.bounds}
                  stock={stock}
                  parsedStats={parsed.stats}
                  currentState={currentState}
                  cameraInfo={cameraInfo}
                  totalLength={parsed.totalLength}
                />
              )}

              {activeTab === "gcode" && (
                <GCodeRightPanel
                  stats={parsed.stats}
                  totalLength={parsed.totalLength}
                />
              )}

              {activeTab === "edit" && (
                <EditRightPanel
                  document={editDocument}
                  setDocument={setEditDocument}
                  selection={selection}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
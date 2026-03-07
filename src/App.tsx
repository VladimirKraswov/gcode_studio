import { useState } from "react";
import type { ChangeEvent } from "react";
import { FiBox, FiEye, FiLoader, FiTool, FiCode } from "react-icons/fi";
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
import type { SketchDocument } from "./types/sketch";
import { createEmptySketchDocument } from "./utils/sketch";
import { theme, ui } from "./styles/ui";

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
  const [editDocument, setEditDocument] = useState<SketchDocument>(
    createEmptySketchDocument(),
  );
  const [fileName, setFileName] = useState("demo.gcode");
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [stock, setStock] = useState<StockDimensions>(DEFAULT_STOCK);
  const [showMaterialRemoval, setShowMaterialRemoval] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("origin");
  const [detailLevel, setDetailLevel] = useState(5);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("view");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

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

  function applyGeneratedGCodeFromEdit(gcode: string) {
    setSource(gcode);
    setFileName("edit-generated.gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
    setActiveTab("gcode");
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
                    onGenerateGCode={applyGeneratedGCodeFromEdit}
                    selectedId={selectedShapeId}
                    onSelect={setSelectedShapeId}
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
                  selectedId={selectedShapeId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
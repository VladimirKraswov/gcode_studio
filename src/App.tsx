import { useState } from "react";
import type { ChangeEvent } from "react";
import type { CameraInfo, PlacementMode, StockDimensions } from "./types/gcode";
import { DEMO_GCODE } from "./constants/demo";
import { GCodeEditorTab } from "./components/GCodeEditorTab";
import { PathScene } from "./components/PathScene";
import { RightInfoPanel } from "./components/RightInfoPanel";
import { useCurrentState } from "./hooks/useCurrentState";
import { useGCodeWorker } from "./hooks/useGCodeWorker";
import { usePlayback } from "./hooks/usePlayback";

const DEFAULT_STOCK: StockDimensions = {
  width: 300,
  height: 180,
  thickness: 3,
};

export default function App() {
  const [source, setSource] = useState(DEMO_GCODE);
  const [fileName, setFileName] = useState("demo.gcode");
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [stock, setStock] = useState<StockDimensions>(DEFAULT_STOCK);
  const [showMaterialRemoval, setShowMaterialRemoval] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("origin");
  const [detailLevel, setDetailLevel] = useState(5);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const [showEditor, setShowEditor] = useState(false);

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

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

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
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>GCode Studio</h2>
          <p>
            {isParsing
              ? "Парсинг G-code... Это может занять несколько секунд."
              : "Загрузите G-code"}
          </p>

          {!isParsing && (
            <input
              type="file"
              accept=".gcode,.nc,.tap,.txt"
              onChange={handleFileChange}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 20,
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr 320px",
          gap: 20,
          maxWidth: 1800,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>GCode Studio</h2>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Загрузка G-code</div>
              <input
                type="file"
                accept=".gcode,.nc,.tap,.txt"
                onChange={handleFileChange}
              />
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Файл</div>
              <div style={{ wordBreak: "break-all" }}>{fileName}</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button type="button" onClick={() => setPlaying((value) => !value)}>
                {playing ? "Пауза" : "Старт"}
              </button>

              <button type="button" onClick={resetPlayback}>
                В начало
              </button>

              <button type="button" onClick={loadDemo}>
                Демо
              </button>

              <button
                type="button"
                onClick={() => setCameraResetKey((value) => value + 1)}
              >
                Сброс вида
              </button>
            </div>

            <div style={{ marginBottom: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Заготовка</div>

              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Позиционирование заготовки
              </div>

              <label style={{ display: "block", marginBottom: 4 }}>
                <input
                  type="radio"
                  name="placementMode"
                  value="origin"
                  checked={placementMode === "origin"}
                  onChange={() => setPlacementMode("origin")}
                />{" "}
                Левый нижний угол
              </label>

              <label style={{ display: "block", marginBottom: 4 }}>
                <input
                  type="radio"
                  name="placementMode"
                  value="center"
                  checked={placementMode === "center"}
                  onChange={() => setPlacementMode("center")}
                />{" "}
                Центрировать по траектории
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 12 }}>
                  Ширина, мм
                  <input
                    type="number"
                    min="1"
                    value={stock.width}
                    onChange={(event) =>
                      setStock((prev) => ({
                        ...prev,
                        width: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>

                <label style={{ fontSize: 12 }}>
                  Высота, мм
                  <input
                    type="number"
                    min="1"
                    value={stock.height}
                    onChange={(event) =>
                      setStock((prev) => ({
                        ...prev,
                        height: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>

                <label style={{ fontSize: 12 }}>
                  Толщина, мм
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={stock.thickness}
                    onChange={(event) =>
                      setStock((prev) => ({
                        ...prev,
                        thickness: Math.max(0.1, Number(event.target.value) || 0.1),
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={showMaterialRemoval}
                  onChange={(event) => setShowMaterialRemoval(event.target.checked)}
                />
                Показывать снятие материала
              </label>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Качество меша
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={detailLevel}
                    onChange={(event) => setDetailLevel(Number(event.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 12 }}>10</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                <span>Прогресс</span>
                <span>{progress.toFixed(1)}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                <span>Скорость</span>
                <span>{speed.toFixed(1)}x</span>
              </div>

              <input
                type="range"
                min="0.2"
                max="5"
                step="0.1"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>3D-превью траектории</h3>

          <div
            style={{
              height: 760,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
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

          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: "#64748b",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>ЛКМ — вращение, ПКМ — панорама, колесо мыши — масштаб.</span>
            <button type="button" onClick={() => setShowEditor((value) => !value)}>
              {showEditor ? "Показать информацию" : "Редактор G-code"}
            </button>
          </div>
        </div>

        {showEditor ? (
          <GCodeEditorTab
            source={source}
            setSource={setSource}
            fileName={fileName}
            onClose={() => setShowEditor(false)}
          />
        ) : (
          <RightInfoPanel
            bounds={parsed.bounds}
            stock={stock}
            parsedStats={parsed.stats}
            currentState={currentState}
            cameraInfo={cameraInfo}
            totalLength={parsed.totalLength}
          />
        )}
      </div>
    </div>
  );
}
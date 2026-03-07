import type { ChangeEvent } from "react";
import { useState } from "react";
import {
  FiBox,
  FiCamera,
  FiChevronDown,
  FiChevronUp,
  FiFolder,
  FiLayers,
  FiPause,
  FiPlay,
  FiSave,
  FiSliders,
  FiSkipBack,
  FiUpload,
} from "react-icons/fi";
import type { PlacementMode, StockDimensions } from "../types/gcode";
import { theme, ui } from "../styles/ui";

type LeftPanelMode = "default" | "cad";

type LeftPanelProps = {
  mode?: LeftPanelMode;

  fileName: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProjectFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveProject: () => void;
  onLoadDemo: () => void;
  onResetCamera: () => void;

  playing: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;

  placementMode: PlacementMode;
  onPlacementModeChange: (mode: PlacementMode) => void;
  stock: StockDimensions;
  onStockChange: (stock: StockDimensions) => void;
  showMaterialRemoval: boolean;
  onShowMaterialRemovalChange: (checked: boolean) => void;
  detailLevel: number;
  onDetailLevelChange: (level: number) => void;
};

export function LeftPanel({
  mode = "default",

  fileName,
  onFileChange,
  onProjectFileChange,
  onSaveProject,
  onLoadDemo,
  onResetCamera,

  playing,
  onPlayPause,
  onResetPlayback,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,

  placementMode,
  onPlacementModeChange,
  stock,
  onStockChange,
  showMaterialRemoval,
  onShowMaterialRemovalChange,
  detailLevel,
  onDetailLevelChange,
}: LeftPanelProps) {
  const [stockCollapsed, setStockCollapsed] = useState(false);

  if (mode === "cad") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ ...ui.panel, padding: 16 }}>
          <div style={ui.panelHeader}>
            <h3 style={ui.sectionTitle}>
              <div style={ui.iconBadge}>
                <FiLayers size={18} />
              </div>
              <span>Объекты CAD</span>
            </h3>
          </div>

          <div
            style={{
              ...ui.panelInset,
              padding: 14,
              color: theme.textMuted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            В режиме CAD в левой колонке должен отображаться список объектов и групп.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={{ ...ui.panel, padding: 16 }}>
        <div style={ui.panelHeader}>
          <h3 style={ui.sectionTitle}>
            <div style={ui.iconBadge}>
              <FiFolder size={18} />
            </div>
            <span>Файл проекта</span>
          </h3>
        </div>

        <label
          style={{
            ...ui.buttonGhost,
            width: "100%",
            justifyContent: "center",
            marginBottom: 12,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FiUpload size={16} />
          <span>Загрузить G-code</span>
          <input
            type="file"
            accept=".gcode,.nc,.tap,.txt"
            onChange={onFileChange}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <label
            style={{
              ...ui.buttonGhost,
              width: "100%",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <FiFolder size={15} />
            <span>Открыть .gs</span>
            <input
              type="file"
              accept=".gs,application/json"
              onChange={onProjectFileChange}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </label>

          <button type="button" onClick={onSaveProject} style={ui.buttonGhost}>
            <FiSave size={15} />
            Сохранить .gs
          </button>
        </div>

        <div
          style={{
            ...ui.panelInset,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={ui.mutedText}>Текущий файл</div>
          <div
            style={{
              marginTop: 6,
              fontWeight: 800,
              color: theme.text,
              wordBreak: "break-word",
            }}
          >
            {fileName}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" onClick={onLoadDemo} style={ui.buttonGhost}>
            <FiBox size={15} />
            Демо
          </button>

          <button type="button" onClick={onResetCamera} style={ui.buttonGhost}>
            <FiCamera size={15} />
            Камера
          </button>
        </div>
      </section>

      <section style={{ ...ui.panel, padding: 16 }}>
        <div style={ui.panelHeader}>
          <h3 style={ui.sectionTitle}>
            <div style={ui.iconBadge}>
              {playing ? <FiPause size={18} /> : <FiPlay size={18} />}
            </div>
            <span>Воспроизведение</span>
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button type="button" onClick={onPlayPause} style={ui.buttonPrimary}>
            {playing ? <FiPause size={15} /> : <FiPlay size={15} />}
            {playing ? "Пауза" : "Старт"}
          </button>

          <button type="button" onClick={onResetPlayback} style={ui.buttonGhost}>
            <FiSkipBack size={15} />
            С начала
          </button>
        </div>

        <RangeCard
          label="Прогресс"
          value={`${progress.toFixed(1)}%`}
          min={0}
          max={100}
          step={0.1}
          current={progress}
          onChange={onProgressChange}
        />

        <RangeCard
          label="Скорость"
          value={`${speed.toFixed(1)}x`}
          min={0.2}
          max={5}
          step={0.1}
          current={speed}
          onChange={onSpeedChange}
        />
      </section>

      <section style={{ ...ui.panel, padding: 16 }}>
        <div
          onClick={() => setStockCollapsed((v) => !v)}
          style={{
            ...ui.panelHeader,
            cursor: "pointer",
            marginBottom: stockCollapsed ? 0 : 14,
          }}
        >
          <h3 style={ui.sectionTitle}>
            <div style={ui.iconBadge}>
              <FiSliders size={18} />
            </div>
            <span>Заготовка и сцена</span>
          </h3>

          <div style={{ color: theme.textSoft }}>
            {stockCollapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
          </div>
        </div>

        {!stockCollapsed && (
          <>
            <div
              style={{
                ...ui.panelInset,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                Позиционирование
              </div>

              <label style={radioLine}>
                <input
                  type="radio"
                  checked={placementMode === "origin"}
                  onChange={() => onPlacementModeChange("origin")}
                />
                <span>Левый нижний угол</span>
              </label>

              <label style={radioLine}>
                <input
                  type="radio"
                  checked={placementMode === "center"}
                  onChange={() => onPlacementModeChange("center")}
                />
                <span>Центрировать по траектории</span>
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <label style={ui.inputLabel}>
                Ширина
                <input
                  type="number"
                  min="1"
                  value={stock.width}
                  onChange={(e) =>
                    onStockChange({
                      ...stock,
                      width: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  style={ui.input}
                />
              </label>

              <label style={ui.inputLabel}>
                Высота
                <input
                  type="number"
                  min="1"
                  value={stock.height}
                  onChange={(e) =>
                    onStockChange({
                      ...stock,
                      height: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  style={ui.input}
                />
              </label>

              <label style={ui.inputLabel}>
                Толщина
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={stock.thickness}
                  onChange={(e) =>
                    onStockChange({
                      ...stock,
                      thickness: Math.max(0.1, Number(e.target.value) || 0.1),
                    })
                  }
                  style={ui.input}
                />
              </label>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: "#fff",
                border: `1px solid ${theme.border}`,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <input
                type="checkbox"
                checked={showMaterialRemoval}
                onChange={(e) => onShowMaterialRemovalChange(e.target.checked)}
              />
              Показывать снятие материала
            </label>

            <RangeCard
              label="Качество меша"
              value={String(detailLevel)}
              min={1}
              max={10}
              step={1}
              current={detailLevel}
              onChange={onDetailLevelChange}
            />
          </>
        )}
      </section>
    </div>
  );
}

function RangeCard({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{
        ...ui.panelInset,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: theme.primaryText }}>
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

const radioLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  color: theme.text,
  marginBottom: 8,
};
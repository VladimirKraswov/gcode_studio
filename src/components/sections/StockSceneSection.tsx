// src/components/sections/StockSceneSection.tsx
import type { PlacementMode, StockDimensions } from "../../types/gcode";
import { useStyles } from "../../styles/useStyles";
import { useTheme } from "../../contexts/ThemeContext";
import { RangeCard } from "./RangeCard";

type StockSceneSectionProps = {
  placementMode: PlacementMode;
  onPlacementModeChange: (mode: PlacementMode) => void;
  stock: StockDimensions;
  onStockChange: (stock: StockDimensions) => void;
  showMaterialRemoval: boolean;
  onShowMaterialRemovalChange: (checked: boolean) => void;
  detailLevel: number;
  onDetailLevelChange: (level: number) => void;
};

export function StockSceneSection({
  placementMode,
  onPlacementModeChange,
  stock,
  onStockChange,
  showMaterialRemoval,
  onShowMaterialRemovalChange,
  detailLevel,
  onDetailLevelChange,
}: StockSceneSectionProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  const radioLine: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: theme.text,
    marginBottom: 8,
  };

  return (
    <>
      <div
        style={{
          ...styles.panelInset,
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
        <label style={styles.inputLabel}>
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
            style={styles.input}
          />
        </label>
        <label style={styles.inputLabel}>
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
            style={styles.input}
          />
        </label>
        <label style={styles.inputLabel}>
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
            style={styles.input}
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
          background: theme.panelSolid,
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
  );
}
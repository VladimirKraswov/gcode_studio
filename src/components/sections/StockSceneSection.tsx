// src/components/sections/StockSceneSection.tsx
import type { PlacementMode, StockDimensions } from "../../types/gcode";
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
  return (
    <>
      <div className="ui-panel-inset mb-3 p-3">
        <div className="mb-2.5 text-[13px] font-extrabold text-[var(--color-text)]">
          Позиционирование
        </div>

        <label className="mb-2 flex items-center gap-2.5 text-[13px] text-[var(--color-text)]">
          <input
            type="radio"
            checked={placementMode === "origin"}
            onChange={() => onPlacementModeChange("origin")}
          />
          <span>Левый нижний угол</span>
        </label>

        <label className="flex items-center gap-2.5 text-[13px] text-[var(--color-text)]">
          <input
            type="radio"
            checked={placementMode === "center"}
            onChange={() => onPlacementModeChange("center")}
          />
          <span>Центрировать по траектории</span>
        </label>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <label className="ui-label">
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
            className="ui-input"
          />
        </label>

        <label className="ui-label">
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
            className="ui-input"
          />
        </label>

        <label className="ui-label">
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
            className="ui-input"
          />
        </label>
      </div>

      <label className="ui-check-row mb-3 rounded-[14px]">
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
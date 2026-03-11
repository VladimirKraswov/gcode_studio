import type { PlacementMode, StockDimensions } from "@/types/gcode";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Switch } from "@/shared/components/ui/Switch";
import { Slider } from "@/shared/components/ui/Slider";

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
    <div className="space-y-5 pt-1">
      <div className="space-y-2.5">
        <Label className="text-[11px] uppercase font-bold text-text-muted tracking-wider">Позиционирование</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-panel-muted cursor-pointer transition-colors border border-transparent has-[:checked]:border-primary/30 has-[:checked]:bg-primary-soft/20">
            <input
              type="radio"
              checked={placementMode === "origin"}
              onChange={() => onPlacementModeChange("origin")}
              className="w-4 h-4 text-primary focus:ring-primary accent-primary"
            />
            <span className="text-[13px] font-medium">Левый нижний угол (X0 Y0)</span>
          </label>

          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-panel-muted cursor-pointer transition-colors border border-transparent has-[:checked]:border-primary/30 has-[:checked]:bg-primary-soft/20">
            <input
              type="radio"
              checked={placementMode === "center"}
              onChange={() => onPlacementModeChange("center")}
              className="w-4 h-4 text-primary focus:ring-primary accent-primary"
            />
            <span className="text-[13px] font-medium">Центрировать по траектории</span>
          </label>
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-[11px] uppercase font-bold text-text-muted tracking-wider">Размеры заготовки (мм)</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[11px]">X (Ширина)</Label>
            <Input
              type="number"
              min="1"
              value={stock.width}
              onChange={(e) =>
                onStockChange({
                  ...stock,
                  width: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Y (Высота)</Label>
            <Input
              type="number"
              min="1"
              value={stock.height}
              onChange={(e) =>
                onStockChange({
                  ...stock,
                  height: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Z (Толщина)</Label>
            <Input
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
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg bg-panel-muted border border-border">
        <Label className="font-bold">Снятие материала</Label>
        <Switch
          checked={showMaterialRemoval}
          onCheckedChange={onShowMaterialRemovalChange}
        />
      </div>

      <div className="space-y-3 p-3 rounded-lg border border-border bg-panel-muted/30">
        <div className="flex justify-between items-center">
          <Label className="font-bold">Качество меша</Label>
          <span className="text-[11px] font-mono text-primary bg-primary-soft px-1.5 rounded">{detailLevel}</span>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={detailLevel}
          onChange={onDetailLevelChange}
        />
        <p className="text-[10px] text-text-muted italic">Более высокое качество требует больше ресурсов GPU</p>
      </div>
    </div>
  );
}

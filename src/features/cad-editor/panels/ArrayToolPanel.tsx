import { FiCopy, FiRefreshCw, FiX } from "react-icons/fi";
import type {
  CircularArrayParams,
  LinearArrayParams,
} from "../model/array";
import { Button } from "@/shared/components/ui/Button";
import { IconButton } from "@/shared/components/ui/IconButton";
import { Input } from "@/shared/components/ui/Input";

export type ArrayToolPanelProps = {
  mode?: "linear" | "circular";
  linear?: LinearArrayParams;
  circular?: CircularArrayParams;
  onLinearChange?: (patch: Partial<LinearArrayParams>) => void;
  onCircularChange?: (patch: Partial<CircularArrayParams>) => void;
  onApply?: () => void;
  onClose?: () => void;
};

export function ArrayToolPanel({
  mode = "linear",
  linear = { count: 3, spacing: 20, axis: "x", direction: "positive" },
  circular = {
    count: 6,
    centerX: 0,
    centerY: 0,
    radius: 30,
    totalAngle: 360,
    rotateItems: true,
    startAngle: 0,
    endAngle: 360,
    direction: "cw"
  },
  onLinearChange = () => {},
  onCircularChange = () => {},
  onApply = () => {},
  onClose = () => {},
}: ArrayToolPanelProps) {
  return (
    <div className="bg-panel border border-border rounded-xl shadow-lg p-3 flex flex-col gap-3 w-[260px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {mode === "linear" ? <FiCopy size={16} /> : <FiRefreshCw size={16} />}
          </div>
          <span className="font-bold text-sm">
            {mode === "linear" ? "Linear Array" : "Circular Array"}
          </span>
        </div>
        <IconButton icon={<FiX size={14} />} onClick={onClose} size="xs" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {mode === "linear" ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Count</label>
              <Input
                type="number"
                min="2"
                value={linear.count}
                onChange={(e) => onLinearChange({ count: Math.max(2, Number(e.target.value)) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Spacing</label>
              <Input
                type="number"
                value={linear.spacing}
                onChange={(e) => onLinearChange({ spacing: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Axis</label>
              <select
                className="bg-panel-solid border border-border rounded-md h-8 text-[11px] px-2 outline-none text-foreground"
                value={linear.axis}
                onChange={(e) => onLinearChange({ axis: e.target.value })}
              >
                <option value="x">X Axis</option>
                <option value="y">Y Axis</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Direction</label>
              <select
                className="bg-panel-solid border border-border rounded-md h-8 text-[11px] px-2 outline-none text-foreground"
                value={linear.direction}
                onChange={(e) => onLinearChange({ direction: e.target.value as any })}
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="col-span-2 flex items-center gap-2 py-1">
                <input
                    type="checkbox"
                    id="enable-2d"
                    checked={!!linear.gridSecondAxis}
                    onChange={(e) => {
                        if (e.target.checked) {
                            onLinearChange({ gridSecondAxis: { count: 2, spacing: 20, axis: "y" } });
                        } else {
                            onLinearChange({ gridSecondAxis: undefined });
                        }
                    }}
                />
                <label htmlFor="enable-2d" className="text-[11px] font-bold">Enable 2D Grid</label>
            </div>

            {linear.gridSecondAxis && (
                <>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted">Count Y</label>
                        <Input
                            type="number"
                            min="1"
                            value={linear.gridSecondAxis.count}
                            onChange={(e) => onLinearChange({
                                gridSecondAxis: { ...linear.gridSecondAxis!, count: Math.max(1, Number(e.target.value)) }
                            })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted">Spacing Y</label>
                        <Input
                            type="number"
                            value={linear.gridSecondAxis.spacing}
                            onChange={(e) => onLinearChange({
                                gridSecondAxis: { ...linear.gridSecondAxis!, spacing: Number(e.target.value) }
                            })}
                        />
                    </div>
                </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Count</label>
              <Input
                type="number"
                min="2"
                value={circular.count}
                onChange={(e) => onCircularChange({ count: Math.max(2, Number(e.target.value)) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Total Angle</label>
              <Input
                type="number"
                value={circular.totalAngle}
                onChange={(e) => onCircularChange({ totalAngle: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Direction</label>
              <select
                className="bg-panel-solid border border-border rounded-md h-8 text-[11px] px-2 outline-none text-foreground"
                value={circular.direction}
                onChange={(e) => onCircularChange({ direction: e.target.value as any })}
              >
                <option value="cw">CW</option>
                <option value="ccw">CCW</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 text-foreground">
                <label className="text-[10px] uppercase font-bold text-text-muted">Rotate Items</label>
                <div className="flex items-center h-8">
                    <input
                        type="checkbox"
                        checked={circular.rotateItems}
                        onChange={(e) => onCircularChange({ rotateItems: e.target.checked })}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Radius</label>
              <Input
                type="number"
                value={circular.radius}
                onChange={(e) => onCircularChange({ radius: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>

      <Button size="sm" onClick={onApply} className="w-full">
        Apply Array
      </Button>
    </div>
  );
}

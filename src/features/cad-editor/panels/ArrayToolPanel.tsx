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
    <div className="bg-panel border border-border rounded-xl shadow-lg p-3 flex flex-col gap-3">
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

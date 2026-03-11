import { FiCopy, FiRefreshCw } from "react-icons/fi";
import type {
  CircularArrayParams,
  LinearArrayParams,
} from "../model/array";
import type { SketchDocument } from "../model/types";
import type { SelectionState } from "../model/selection";

export type ArrayToolPanelProps = {
  document?: SketchDocument;
  selection?: SelectionState;
  onSelectionChange?: (next: SelectionState) => void;
  setDocument?: React.Dispatch<React.SetStateAction<SketchDocument>>;

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
  circular = { count: 6, centerX: 0, centerY: 0, radius: 30, totalAngle: 360, rotateItems: true },
  onLinearChange = () => {},
  onCircularChange = () => {},
  onApply = () => {},
}: ArrayToolPanelProps) {
  return (
    <div className="ui-panel-inset mb-3 grid shrink-0 gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
            {mode === "linear" ? <FiCopy size={16} /> : <FiRefreshCw size={16} />}
          </div>

          <div>
            <div className="text-[15px] font-extrabold text-text">
              {mode === "linear" ? "Линейный массив" : "Круговой массив"}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onApply} className="ui-btn-primary">
            Применить
          </button>
        </div>
      </div>

      {mode === "linear" ? (
        <div className="grid grid-cols-2 gap-2.5">
          <label className="ui-label">
            Количество
            <input
              type="number"
              min="2"
              value={linear.count}
              onChange={(e) => onLinearChange({ count: Math.max(2, Number(e.target.value)) })}
              className="ui-input"
            />
          </label>
          <label className="ui-label">
            Шаг
            <input
              type="number"
              value={linear.spacing}
              onChange={(e) => onLinearChange({ spacing: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <label className="ui-label">
            Количество
            <input
              type="number"
              min="2"
              value={circular.count}
              onChange={(e) => onCircularChange({ count: Math.max(2, Number(e.target.value)) })}
              className="ui-input"
            />
          </label>
          <label className="ui-label">
            Радиус
            <input
              type="number"
              value={circular.radius}
              onChange={(e) => onCircularChange({ radius: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
        </div>
      )}
    </div>
  );
}

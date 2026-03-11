import { FiCopy, FiRefreshCw, FiX } from "react-icons/fi";
import type {
  CircularArrayParams,
  LinearArrayParams,
} from "../model/array";

type ArrayToolMode = "linear" | "circular";

type ArrayToolPanelProps = {
  mode: ArrayToolMode;
  linear: LinearArrayParams;
  circular: CircularArrayParams;
  onLinearChange: (patch: Partial<LinearArrayParams>) => void;
  onCircularChange: (patch: Partial<CircularArrayParams>) => void;
  onApply: () => void;
  onClose: () => void;
};

export function ArrayToolPanel({
  mode,
  linear,
  circular,
  onLinearChange,
  onCircularChange,
  onApply,
  onClose,
}: ArrayToolPanelProps) {
  return (
    <div className="ui-panel-inset mb-3 grid shrink-0 gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
            {mode === "linear" ? <FiCopy size={16} /> : <FiRefreshCw size={16} />}
          </div>

          <div>
            <div className="text-[15px] font-extrabold text-[var(--color-text)]">
              {mode === "linear" ? "Линейный массив" : "Круговой массив"}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              Оператор применяется к текущему выделению
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="ui-btn-ghost">
            <FiX size={15} />
            Закрыть
          </button>
          <button type="button" onClick={onApply} className="ui-btn-primary">
            Применить
          </button>
        </div>
      </div>

      {mode === "linear" ? (
        <div className="grid grid-cols-4 gap-2.5">
          <label className="ui-label">
            Количество
            <input
              type="number"
              min="2"
              step="1"
              value={linear.count}
              onChange={(e) =>
                onLinearChange({
                  count: Math.max(2, Number(e.target.value) || 2),
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Шаг
            <input
              type="number"
              step="0.001"
              value={linear.spacing}
              onChange={(e) =>
                onLinearChange({
                  spacing: Math.abs(Number(e.target.value) || 0),
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Ось
            <select
              value={linear.axis}
              onChange={(e) =>
                onLinearChange({
                  axis: e.target.value as LinearArrayParams["axis"],
                })
              }
              className="ui-input"
            >
              <option value="x">X</option>
              <option value="y">Y</option>
            </select>
          </label>

          <label className="ui-label">
            Направление
            <select
              value={linear.direction}
              onChange={(e) =>
                onLinearChange({
                  direction: e.target.value as LinearArrayParams["direction"],
                })
              }
              className="ui-input"
            >
              <option value="positive">Плюс</option>
              <option value="negative">Минус</option>
            </select>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-2.5">
          <label className="ui-label">
            Количество
            <input
              type="number"
              min="2"
              step="1"
              value={circular.count}
              onChange={(e) =>
                onCircularChange({
                  count: Math.max(2, Number(e.target.value) || 2),
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Center X
            <input
              type="number"
              step="0.001"
              value={circular.centerX}
              onChange={(e) =>
                onCircularChange({
                  centerX: Number(e.target.value) || 0,
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Center Y
            <input
              type="number"
              step="0.001"
              value={circular.centerY}
              onChange={(e) =>
                onCircularChange({
                  centerY: Number(e.target.value) || 0,
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Радиус
            <input
              type="number"
              min="0"
              step="0.001"
              value={circular.radius}
              onChange={(e) =>
                onCircularChange({
                  radius: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="ui-input"
            />
          </label>

          <label className="ui-label">
            Total angle
            <input
              type="number"
              step="0.001"
              value={circular.totalAngle}
              onChange={(e) =>
                onCircularChange({
                  totalAngle: Number(e.target.value) || 0,
                })
              }
              className="ui-input"
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-[13px] font-bold text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={circular.rotateItems}
              onChange={(e) =>
                onCircularChange({
                  rotateItems: e.target.checked,
                })
              }
            />
            Rotate items
          </label>
        </div>
      )}
    </div>
  );
}
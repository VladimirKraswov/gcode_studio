import { FiCopy, FiRefreshCw, FiX } from "react-icons/fi";
import { useStyles } from "../../../styles/useStyles";
import { useTheme } from "../../../contexts/ThemeContext";
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
  const styles = useStyles();
  const { theme } = useTheme();

  const fieldLabel = styles.inputLabel;

  return (
    <div
      style={{
        ...styles.panelInset,
        padding: 12,
        marginBottom: 12,
        display: "grid",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.iconBadge}>
            {mode === "linear" ? <FiCopy size={16} /> : <FiRefreshCw size={16} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>
              {mode === "linear" ? "Линейный массив" : "Круговой массив"}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              Оператор применяется к текущему выделению
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} style={styles.buttonGhost}>
            <FiX size={15} />
            Закрыть
          </button>
          <button type="button" onClick={onApply} style={styles.buttonPrimary}>
            Применить
          </button>
        </div>
      </div>

      {mode === "linear" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
            Ось
            <select
              value={linear.axis}
              onChange={(e) =>
                onLinearChange({
                  axis: e.target.value as LinearArrayParams["axis"],
                })
              }
              style={styles.select}
            >
              <option value="x">X</option>
              <option value="y">Y</option>
            </select>
          </label>

          <label style={fieldLabel}>
            Направление
            <select
              value={linear.direction}
              onChange={(e) =>
                onLinearChange({
                  direction: e.target.value as LinearArrayParams["direction"],
                })
              }
              style={styles.select}
            >
              <option value="positive">Плюс</option>
              <option value="negative">Минус</option>
            </select>
          </label>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label style={fieldLabel}>
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
              style={styles.input}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-end",
              paddingBottom: 8,
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: theme.text,
            }}
          >
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
// src/modules/cad/panels/settings/SpindleLaserSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import { useTheme } from "../../../../contexts/ThemeContext";
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type SpindleLaserSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function SpindleLaserSection({ document, setDocument }: SpindleLaserSectionProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    color: theme.text,
    padding: 12,
    borderRadius: 12,
    background: theme.panelSolid,
    border: `1px solid ${theme.border}`,
  };

  return (
    <CollapsibleCardBlock title="Шпиндель / лазер / охлаждение">
      <div style={twoColumnGrid}>
        <label style={styles.inputLabel}>
          Spindle speed (S)
          <input
            style={styles.input}
            type="number"
            min="0"
            value={document.spindleSpeed}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleSpeed: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Направление
          <select
            value={document.spindleDirection}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleDirection: e.target.value as SketchDocument["spindleDirection"],
              }))
            }
            style={styles.select}
          >
            <option value="cw">CW (M3)</option>
            <option value="ccw">CCW (M4)</option>
          </select>
        </label>

        <label style={styles.inputLabel}>
          S power
          <input
            style={styles.input}
            type="number"
            min="0"
            value={document.laserPower}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                laserPower: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Dwell, мс
          <input
            style={styles.input}
            type="number"
            min="0"
            value={document.dwellMs}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                dwellMs: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={document.spindleOn}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleOn: e.target.checked,
              }))
            }
          />
          <span>Включать M3/M4/M5</span>
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={document.coolant}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                coolant: e.target.checked,
              }))
            }
          />
          <span>Охлаждение M8/M9</span>
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={document.returnHome}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                returnHome: e.target.checked,
              }))
            }
          />
          <span>Возвращать в X0 Y0 в конце</span>
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
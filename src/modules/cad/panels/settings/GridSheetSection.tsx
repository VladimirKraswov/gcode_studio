// src/modules/cad/panels/settings/GridSheetSection.tsx
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

type GridSheetSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GridSheetSection({ document, setDocument }: GridSheetSectionProps) {
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
    <CollapsibleCardBlock title="Сетка и лист">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={twoColumnGrid}>
          <label style={styles.inputLabel}>
            Ширина листа
            <input
              style={styles.input}
              type="number"
              min="1"
              value={document.width}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  width: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label style={styles.inputLabel}>
            Высота листа
            <input
              style={styles.input}
              type="number"
              min="1"
              value={document.height}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  height: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>
        </div>

        <label style={styles.inputLabel}>
          Шаг сетки
          <input
            style={styles.input}
            type="number"
            min="1"
            value={document.snapStep}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                snapStep: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={document.snapEnabled}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                snapEnabled: e.target.checked,
              }))
            }
          />
          <span>Привязка к сетке</span>
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
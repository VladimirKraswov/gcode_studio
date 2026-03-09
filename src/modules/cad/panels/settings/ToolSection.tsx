// src/modules/cad/panels/settings/ToolSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const threeColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type ToolSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ToolSection({ document, setDocument }: ToolSectionProps) {
  const styles = useStyles();

  return (
    <CollapsibleCardBlock title="Инструмент">
      <div style={threeColumnGrid}>
        <label style={styles.inputLabel}>
          Тип инструмента
          <select
            value={document.toolType}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                toolType: e.target.value as SketchDocument["toolType"],
                spindleOn: e.target.value === "laser" ? true : prev.spindleOn,
              }))
            }
            style={styles.select}
          >
            <option value="router">Router</option>
            <option value="spindle">Spindle</option>
            <option value="laser">Laser</option>
            <option value="drag-knife">Drag knife</option>
          </select>
        </label>

        <label style={styles.inputLabel}>
          Tool number
          <input
            style={styles.input}
            type="number"
            min="1"
            value={document.toolNumber}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                toolNumber: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Диаметр инструмента
          <input
            style={styles.input}
            type="number"
            min="0"
            step="0.001"
            value={document.toolDiameter}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                toolDiameter: Math.max(0.001, Number(e.target.value) || 0.001),
              }))
            }
          />
        </label>
      </div>

      <div style={{ marginTop: 10 }}>
        <label style={styles.inputLabel}>
          Stepover (0..1)
          <input
            style={styles.input}
            type="number"
            min="0.05"
            max="1"
            step="0.01"
            value={document.stepover}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                stepover: Math.min(1, Math.max(0.05, Number(e.target.value) || 0.45)),
              }))
            }
          />
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
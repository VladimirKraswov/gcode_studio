// src/modules/cad/panels/settings/ZAxisSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type ZAxisSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ZAxisSection({ document, setDocument }: ZAxisSectionProps) {
  const styles = useStyles();

  return (
    <CollapsibleCardBlock title="Оси Z и проходы">
      <div style={twoColumnGrid}>
        <label style={styles.inputLabel}>
          Start Z
          <input
            style={styles.input}
            type="number"
            value={document.startZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                startZ: Number(e.target.value) || 0,
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Safe Z
          <input
            style={styles.input}
            type="number"
            value={document.safeZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                safeZ: Number(e.target.value) || 0,
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Cut Z по умолчанию
          <input
            style={styles.input}
            type="number"
            value={document.cutZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                cutZ: Number(e.target.value) || 0,
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Pass depth
          <input
            style={styles.input}
            type="number"
            min="0.001"
            step="0.001"
            value={document.passDepth}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                passDepth: Math.max(0.001, Number(e.target.value) || 0.001),
              }))
            }
          />
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
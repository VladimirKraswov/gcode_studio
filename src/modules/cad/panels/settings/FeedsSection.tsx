// src/modules/cad/panels/settings/FeedsSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const threeColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type FeedsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function FeedsSection({ document, setDocument }: FeedsSectionProps) {
  const styles = useStyles();

  return (
    <CollapsibleCardBlock title="Подачи">
      <div style={threeColumnGrid}>
        <label style={styles.inputLabel}>
          Feed cut
          <input
            style={styles.input}
            type="number"
            min="1"
            value={document.feedCut}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                feedCut: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Feed plunge
          <input
            style={styles.input}
            type="number"
            min="1"
            value={document.feedPlunge}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                feedPlunge: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </label>

        <label style={styles.inputLabel}>
          Feed rapid
          <input
            style={styles.input}
            type="number"
            min="1"
            value={document.feedRapid}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                feedRapid: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
// src/modules/cad/panels/settings/GenerationBasicsSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type GenerationBasicsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GenerationBasicsSection({ document, setDocument }: GenerationBasicsSectionProps) {
  const styles = useStyles();

  return (
    <CollapsibleCardBlock title="Основные настройки генерации">
      <div style={twoColumnGrid}>
        <label style={styles.inputLabel}>
          Единицы
          <select
            value={document.units}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                units: e.target.value as SketchDocument["units"],
              }))
            }
            style={styles.select}
          >
            <option value="mm">мм (G21)</option>
            <option value="inch">дюймы (G20)</option>
          </select>
        </label>

        <label style={styles.inputLabel}>
          Work offset
          <select
            value={document.workOffset}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                workOffset: e.target.value as SketchDocument["workOffset"],
              }))
            }
            style={styles.select}
          >
            <option value="G54">G54</option>
            <option value="G55">G55</option>
            <option value="G56">G56</option>
            <option value="G57">G57</option>
            <option value="G58">G58</option>
            <option value="G59">G59</option>
          </select>
        </label>
      </div>
    </CollapsibleCardBlock>
  );
}
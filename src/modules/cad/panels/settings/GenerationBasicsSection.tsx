// src/modules/cad/panels/settings/GenerationBasicsSection.tsx
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type GenerationBasicsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GenerationBasicsSection({
  document,
  setDocument,
}: GenerationBasicsSectionProps) {
  return (
    <CollapsibleCardBlock title="Основные настройки генерации">
      <div className="grid min-w-0 grid-cols-2 gap-2.5">
        <label className="ui-label">
          Единицы
          <select
            value={document.units}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                units: e.target.value as SketchDocument["units"],
              }))
            }
            className="ui-input"
          >
            <option value="mm">мм (G21)</option>
            <option value="inch">дюймы (G20)</option>
          </select>
        </label>

        <label className="ui-label">
          Work offset
          <select
            value={document.workOffset}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                workOffset: e.target.value as SketchDocument["workOffset"],
              }))
            }
            className="ui-input"
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
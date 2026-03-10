// src/modules/cad/panels/settings/ToolSection.tsx
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type ToolSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ToolSection({ document, setDocument }: ToolSectionProps) {
  return (
    <CollapsibleCardBlock title="Инструмент">
      <div className="grid min-w-0 grid-cols-3 gap-2.5">
        <label className="ui-label">
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
            className="ui-input"
          >
            <option value="router">Router</option>
            <option value="spindle">Spindle</option>
            <option value="laser">Laser</option>
            <option value="drag-knife">Drag knife</option>
          </select>
        </label>

        <label className="ui-label">
          Tool number
          <input
            className="ui-input"
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

        <label className="ui-label">
          Диаметр инструмента
          <input
            className="ui-input"
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

      <div className="mt-2.5">
        <label className="ui-label">
          Stepover (0..1)
          <input
            className="ui-input"
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
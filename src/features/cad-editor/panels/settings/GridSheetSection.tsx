// src/modules/cad/panels/settings/GridSheetSection.tsx
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type GridSheetSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GridSheetSection({
  document,
  setDocument,
}: GridSheetSectionProps) {
  return (
    <CollapsibleCardBlock title="Сетка и лист">
      <div className="grid gap-2.5">
        <div className="grid min-w-0 grid-cols-2 gap-2.5">
          <label className="ui-label">
            Ширина листа
            <input
              className="ui-input"
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

          <label className="ui-label">
            Высота листа
            <input
              className="ui-input"
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

        <label className="ui-label">
          Шаг сетки
          <input
            className="ui-input"
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

        <label className="ui-check-row">
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
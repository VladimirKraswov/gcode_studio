// src/modules/cad/panels/settings/ZAxisSection.tsx
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type ZAxisSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ZAxisSection({ document, setDocument }: ZAxisSectionProps) {
  return (
    <CollapsibleCardBlock title="Оси Z и проходы">
      <div className="grid min-w-0 grid-cols-2 gap-2.5">
        <label className="ui-label">
          Start Z
          <input
            className="ui-input"
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

        <label className="ui-label">
          Safe Z
          <input
            className="ui-input"
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

        <label className="ui-label">
          Cut Z по умолчанию
          <input
            className="ui-input"
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

        <label className="ui-label">
          Pass depth
          <input
            className="ui-input"
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
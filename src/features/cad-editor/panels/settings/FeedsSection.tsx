// src/modules/cad/panels/settings/FeedsSection.tsx
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type FeedsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function FeedsSection({ document, setDocument }: FeedsSectionProps) {
  return (
    <CollapsibleCardBlock title="Подачи">
      <div className="grid min-w-0 grid-cols-3 gap-2.5">
        <label className="ui-label">
          Feed cut
          <input
            className="ui-input"
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

        <label className="ui-label">
          Feed plunge
          <input
            className="ui-input"
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

        <label className="ui-label">
          Feed rapid
          <input
            className="ui-input"
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
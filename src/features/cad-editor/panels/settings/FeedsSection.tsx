// src/features/cad-editor/panels/settings/FeedsSection.tsx
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";

type FeedsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function FeedsSection({ document, setDocument }: FeedsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label>Рабочая подача (F cut)</Label>
          <Input
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
        </div>

        <div className="space-y-1.5">
          <Label>Подача врезания (F plunge)</Label>
          <Input
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
        </div>

        <div className="space-y-1.5">
          <Label>Холостой ход (F rapid)</Label>
          <Input
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
        </div>
      </div>
    </div>
  );
}

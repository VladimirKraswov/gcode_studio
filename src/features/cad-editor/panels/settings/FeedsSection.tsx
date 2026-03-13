// src/features/cad-editor/panels/settings/FeedsSection.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";

type FeedsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function FeedsSection({ document, setDocument }: FeedsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.feed_cut")}</Label>
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
          <Label>{t("cad.doc_settings.feed_plunge")}</Label>
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
          <Label>{t("cad.doc_settings.feed_rapid")}</Label>
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

// src/features/cad-editor/panels/settings/GenerationBasicsSection.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";

type GenerationBasicsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GenerationBasicsSection({
  document,
  setDocument,
}: GenerationBasicsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.units")}</Label>
          <select
            value={document.units}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                units: e.target.value as SketchDocument["units"],
              }))
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="mm">mm (G21)</option>
            <option value="inch">inch (G20)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.offset")}</Label>
          <select
            value={document.workOffset}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                workOffset: e.target.value as SketchDocument["workOffset"],
              }))
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="G54">G54</option>
            <option value="G55">G55</option>
            <option value="G56">G56</option>
            <option value="G57">G57</option>
            <option value="G58">G58</option>
            <option value="G59">G59</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// src/features/cad-editor/panels/settings/GridSheetSection.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Switch } from "@/shared/components/ui/Switch";

type GridSheetSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function GridSheetSection({
  document,
  setDocument,
}: GridSheetSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.width")}</Label>
          <Input
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
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.height")}</Label>
          <Input
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
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("cad.doc_settings.grid_step")}</Label>
        <Input
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
      </div>

      <div className="flex items-center justify-between p-2 rounded-md bg-panel-muted border border-border">
        <Label className="font-medium">{t("cad.doc_settings.snap_grid")}</Label>
        <Switch
          checked={document.snapEnabled}
          onCheckedChange={(checked) =>
            setDocument((prev) => ({
              ...prev,
              snapEnabled: checked,
            }))
          }
        />
      </div>
    </div>
  );
}

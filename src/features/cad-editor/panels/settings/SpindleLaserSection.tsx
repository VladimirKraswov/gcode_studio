// src/features/cad-editor/panels/settings/SpindleLaserSection.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Switch } from "@/shared/components/ui/Switch";

type SpindleLaserSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function SpindleLaserSection({
  document,
  setDocument,
}: SpindleLaserSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.spindle_rpm")}</Label>
          <Input
            type="number"
            min="0"
            value={document.spindleSpeed}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleSpeed: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.direction")}</Label>
          <select
            value={document.spindleDirection}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleDirection: e.target.value as SketchDocument["spindleDirection"],
              }))
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="cw">CW (M3)</option>
            <option value="ccw">CCW (M4)</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-panel-muted border border-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">M3/M4/M5</Label>
          <Switch
            checked={document.spindleOn}
            onCheckedChange={(checked) =>
              setDocument((prev) => ({
                ...prev,
                spindleOn: checked,
              }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="font-medium">{t("cad.doc_settings.coolant")}</Label>
          <Switch
            checked={document.coolant}
            onCheckedChange={(checked) =>
              setDocument((prev) => ({
                ...prev,
                coolant: checked,
              }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="font-medium">{t("cad.doc_settings.return_to_zero")}</Label>
          <Switch
            checked={document.returnHome}
            onCheckedChange={(checked) =>
              setDocument((prev) => ({
                ...prev,
                returnHome: checked,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

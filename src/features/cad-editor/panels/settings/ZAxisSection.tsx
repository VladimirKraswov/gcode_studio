// src/features/cad-editor/panels/settings/ZAxisSection.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";

type ZAxisSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ZAxisSection({ document, setDocument }: ZAxisSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.start_z")}</Label>
          <Input
            type="number"
            value={document.startZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                startZ: Number(e.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.safe_z")}</Label>
          <Input
            type="number"
            value={document.safeZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                safeZ: Number(e.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.cut_z")}</Label>
          <Input
            type="number"
            value={document.cutZ}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                cutZ: Number(e.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("cad.doc_settings.pass_depth")}</Label>
          <Input
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
        </div>
      </div>
    </div>
  );
}

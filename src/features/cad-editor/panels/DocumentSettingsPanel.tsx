// src/features/cad-editor/panels/DocumentSettingsPanel.tsx
import { useTranslation } from "react-i18next";
import type { SketchDocument } from "../model/types";
import {
  GridSheetSection,
  GenerationBasicsSection,
  ZAxisSection,
  FeedsSection,
  ToolSection,
  CamDefaultsSection,
  SpindleLaserSection,
} from "./settings";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { FiGrid, FiTool, FiZap, FiMove, FiTarget, FiArrowDown } from "react-icons/fi";

type DocumentSettingsPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function DocumentSettingsPanel({
  document,
  setDocument,
}: DocumentSettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 p-1">
      <CollapsibleSection title={t("cad.doc_settings.grid_sheet")} icon={<FiGrid size={16} />} defaultCollapsed={false}>
        <div className="pt-2">
          <GridSheetSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.tool_params")} icon={<FiTool size={16} />}>
        <div className="pt-2">
          <ToolSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.feeds_speeds")} icon={<FiZap size={16} />}>
        <div className="pt-2">
          <FeedsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.z_settings")} icon={<FiArrowDown size={16} />}>
        <div className="pt-2">
          <ZAxisSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.cam_params")} icon={<FiTarget size={16} />}>
        <div className="pt-2">
          <CamDefaultsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.spindle_control")} icon={<FiMove size={16} />}>
        <div className="pt-2">
          <SpindleLaserSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("cad.doc_settings.gcode_gen")} icon={<FiMove size={16} />}>
        <div className="pt-2">
          <GenerationBasicsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

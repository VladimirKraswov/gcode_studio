// src/features/cad-editor/panels/DocumentSettingsPanel.tsx
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
  return (
    <div className="flex flex-col gap-2 p-1">
      <CollapsibleSection title="Сетка и Лист" icon={<FiGrid size={16} />} defaultCollapsed={false}>
        <div className="pt-2">
          <GridSheetSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Параметры инструмента" icon={<FiTool size={16} />}>
        <div className="pt-2">
          <ToolSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Подачи и Скорости" icon={<FiZap size={16} />}>
        <div className="pt-2">
          <FeedsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Настройки Z" icon={<FiArrowDown size={16} />}>
        <div className="pt-2">
          <ZAxisSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Параметры CAM" icon={<FiTarget size={16} />}>
        <div className="pt-2">
          <CamDefaultsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Управление шпинделем" icon={<FiMove size={16} />}>
        <div className="pt-2">
          <SpindleLaserSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Генерация G-code" icon={<FiMove size={16} />}>
        <div className="pt-2">
          <GenerationBasicsSection document={document} setDocument={setDocument} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

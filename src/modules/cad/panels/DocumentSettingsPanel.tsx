// src/modules/cad/panels/DocumentSettingsPanel.tsx
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
import { SettingsTabs } from "./settings/SettingsTabs";

type DocumentSettingsPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function DocumentSettingsPanel({
  document,
  setDocument,
}: DocumentSettingsPanelProps) {
  const tabs = [
    {
      id: "scene",
      label: "Документ",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <GridSheetSection document={document} setDocument={setDocument} />
        </div>
      ),
    },
    {
      id: "tool",
      label: "CAM",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <ToolSection document={document} setDocument={setDocument} />
          <FeedsSection document={document} setDocument={setDocument} />
          <CamDefaultsSection document={document} setDocument={setDocument} />
          <SpindleLaserSection document={document} setDocument={setDocument} />
          <GenerationBasicsSection document={document} setDocument={setDocument} />
          <ZAxisSection document={document} setDocument={setDocument} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SettingsTabs tabs={tabs} />
    </div>
  );
}
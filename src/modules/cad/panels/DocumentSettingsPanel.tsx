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

type DocumentSettingsPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function DocumentSettingsPanel({
  document,
  setDocument,
}: DocumentSettingsPanelProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <GridSheetSection document={document} setDocument={setDocument} />
      <GenerationBasicsSection document={document} setDocument={setDocument} />
      <ZAxisSection document={document} setDocument={setDocument} />
      <FeedsSection document={document} setDocument={setDocument} />
      <ToolSection document={document} setDocument={setDocument} />
      <CamDefaultsSection document={document} setDocument={setDocument} />
      <SpindleLaserSection document={document} setDocument={setDocument} />
    </div>
  );
}
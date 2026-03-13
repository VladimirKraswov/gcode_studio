import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiBarChart2, FiEdit, FiInfo, FiTool } from "react-icons/fi";

import { useGCode } from "@/contexts/GCodeContext";
import { useUI } from "@/contexts/UIContext";
import { useCad } from "@/contexts/CadContext";
import { RightPanel } from "@/components/RightPanel";
import { InfoPanelSection } from "@/features/preview/components/panels/InfoPanelSection";
import { GCodeStatsSection } from "@/features/preview/components/panels/GCodeStatsSection";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { Tabs } from "@/shared/components/ui/Tabs";
import { CadPropertiesSection, CamPropertiesSection } from "./RightPanelSections";

type CadTab = "cad" | "cam";

export function RightPanelContainer() {
  const { t } = useTranslation();
  const { activeTab } = useUI();
  const { parsed, currentState, stock } = useGCode();
  const { cameraInfo, editDocument, setEditDocument, selection, cadEditor } = useCad();

  const [cadTab, setCadTab] = useState<CadTab>("cad");

  if (activeTab === "edit") {
    return (
      <RightPanel>
        <Tabs
          tabs={[
            { id: "cad", label: "CAD", icon: <FiEdit size={14} /> },
            { id: "cam", label: "CAM", icon: <FiTool size={14} /> },
          ]}
          activeTab={cadTab}
          onChange={(id) => setCadTab(id as CadTab)}
          className="mb-2"
        />

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {cadTab === "cad" ? (
            <CadPropertiesSection
              editDocument={editDocument}
              setEditDocument={setEditDocument}
              selection={selection}
              cadEditor={cadEditor}
            />
          ) : (
            <CamPropertiesSection
              editDocument={editDocument}
              setEditDocument={setEditDocument}
            />
          )}
        </div>
      </RightPanel>
    );
  }

  return (
    <RightPanel>
      <div className="flex flex-col gap-4">
        <CollapsibleSection title={t("common.status")} icon={<FiInfo size={18} />}>
          <InfoPanelSection
            bounds={parsed?.bounds ?? { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }}
            stock={stock}
            parsedStats={parsed?.stats ?? { totalLines: 0, totalMoves: 0, rapidMoves: 0, workMoves: 0, cuttingMoves: 0, renderMoves: 0, renderStep: 0 }}
            currentState={currentState}
            cameraInfo={cameraInfo}
            totalLength={parsed?.totalLength ?? 0}
          />
        </CollapsibleSection>

        <CollapsibleSection title={t("common.statistics")} icon={<FiBarChart2 size={18} />}>
          <GCodeStatsSection parsed={parsed ?? undefined} />
        </CollapsibleSection>
      </div>
    </RightPanel>
  );
}

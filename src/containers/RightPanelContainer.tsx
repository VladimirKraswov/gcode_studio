import { useApp } from "@/contexts/AppContext";
import { RightPanel } from "@/components/RightPanel";
import { InfoPanelSection } from "@/features/preview/components/panels/InfoPanelSection";
import { GCodeStatsSection } from "@/features/preview/components/panels/GCodeStatsSection";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { Tabs } from "@/shared/components/ui/Tabs";
import { FiInfo, FiBarChart2, FiSettings, FiEdit, FiTool } from "react-icons/fi";
import {
  ShapePropertiesPanel,
  DocumentSettingsPanel
} from "@/features/cad-editor";
import { useState } from "react";

type CadTab = "cad" | "cam";

export function RightPanelContainer() {
  const {
    activeTab,
    parsed,
    currentState,
    cameraInfo,
    stock,
    editDocument,
    setEditDocument,
    selection,
  } = useApp();

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
          {cadTab === "cad" && (
            <div className="flex flex-col gap-4">
              <ShapePropertiesPanel
                document={editDocument}
                setDocument={setEditDocument}
                selection={selection}
              />
            </div>
          )}

          {cadTab === "cam" && (
            <div className="flex flex-col gap-4">
              <DocumentSettingsPanel
                document={editDocument}
                setDocument={setEditDocument}
              />
            </div>
          )}
        </div>
      </RightPanel>
    );
  }

  return (
    <RightPanel>
      <div className="flex flex-col gap-4">
          <InfoPanelSection
            bounds={parsed?.bounds ?? { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 }}
            stock={stock}
            parsedStats={parsed?.stats ?? {
              totalLines: 0,
              totalMoves: 0,
              rapidMoves: 0,
              workMoves: 0,
              cuttingMoves: 0,
              renderMoves: 0,
              renderStep: 0,
            }}
            currentState={currentState}
            cameraInfo={cameraInfo}
            totalLength={parsed?.totalLength ?? 0}
          />
          <GCodeStatsSection parsed={parsed ?? undefined} />
      </div>
    </RightPanel>
  );
}

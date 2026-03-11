import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { RightPanel } from "@/components/RightPanel";
import { InfoPanelSection } from "@/features/preview/components/panels/InfoPanelSection";
import { GCodeStatsSection } from "@/features/preview/components/panels/GCodeStatsSection";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { Tabs } from "@/shared/components/ui/Tabs";
import { FiInfo, FiBarChart2, FiLayers, FiSettings, FiEdit, FiDatabase, FiTool } from "react-icons/fi";
import {
  ShapePropertiesPanel,
  ArrayToolPanel,
  TextToolPanel,
  DocumentSettingsPanel
} from "@/features/cad-editor";

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
    setSelection,
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

        {cadTab === "cad" && (
          <div className="flex flex-col gap-4">
            <CollapsibleSection title="Свойства объекта" icon={<FiEdit size={18} />}>
              <ShapePropertiesPanel
                document={editDocument}
                setDocument={setEditDocument}
                selection={selection}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Массив" icon={<FiLayers size={18} />} defaultCollapsed>
              <ArrayToolPanel
                document={editDocument}
                selection={selection}
                onSelectionChange={setSelection}
                setDocument={setEditDocument}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Текст" icon={<FiDatabase size={18} />} defaultCollapsed>
              <TextToolPanel
                document={editDocument}
                selection={selection}
                onSelectionChange={setSelection}
                setDocument={setEditDocument}
              />
            </CollapsibleSection>
          </div>
        )}

        {cadTab === "cam" && (
          <div className="flex flex-col gap-4">
            <CollapsibleSection title="Настройки документа" icon={<FiSettings size={18} />}>
              <DocumentSettingsPanel
                document={editDocument}
                setDocument={setEditDocument}
              />
            </CollapsibleSection>
          </div>
        )}
      </RightPanel>
    );
  }

  return (
    <RightPanel>
      <div className="flex flex-col gap-4">
        <CollapsibleSection title="Состояние" icon={<FiInfo size={18} />}>
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
        </CollapsibleSection>

        <CollapsibleSection title="Статистика" icon={<FiBarChart2 size={18} />}>
          <GCodeStatsSection parsed={parsed ?? undefined} />
        </CollapsibleSection>
      </div>
    </RightPanel>
  );
}

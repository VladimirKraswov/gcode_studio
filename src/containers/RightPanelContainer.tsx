import { useApp } from "@/contexts/AppContext";
import { RightPanel } from "@/components/RightPanel";
import { InfoPanelSection } from "@/features/preview/components/panels/InfoPanelSection";
import { GCodeStatsSection } from "@/features/preview/components/panels/GCodeStatsSection";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { FiInfo, FiBarChart2, FiLayers, FiSettings, FiEdit, FiDatabase } from "react-icons/fi";
import {
  ObjectListPanel,
  ShapePropertiesPanel,
  ArrayToolPanel,
  TextToolPanel,
  DocumentSettingsPanel
} from "@/features/cad-editor";

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

  if (activeTab === "edit") {
    return (
      <RightPanel>
        <CollapsibleSection title="Объекты" icon={<FiLayers size={18} />}>
          <ObjectListPanel
            document={editDocument}
            selection={selection}
            onSelectionChange={setSelection}
            onRenameShape={() => {}}
            onRenameGroup={() => {}}
            onToggleGroupCollapsed={() => {}}
            onToggleVisibility={() => {}}
            onDeleteShape={() => {}}
            onReorderShapes={() => {}}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Свойства" icon={<FiEdit size={18} />}>
          <ShapePropertiesPanel
            document={editDocument}
            setDocument={setEditDocument}
            selection={selection}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Инструменты" icon={<FiDatabase size={18} />} defaultCollapsed>
          <div className="flex flex-col gap-4">
            <ArrayToolPanel
              document={editDocument}
              selection={selection}
              onSelectionChange={setSelection}
            />
            <TextToolPanel
              document={editDocument}
              selection={selection}
              onSelectionChange={setSelection}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Настройки документа" icon={<FiSettings size={18} />} defaultCollapsed>
          <DocumentSettingsPanel
            document={editDocument}
            setDocument={setEditDocument}
          />
        </CollapsibleSection>
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

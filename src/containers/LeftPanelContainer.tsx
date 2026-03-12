import { useGCode } from "@/contexts/GCodeContext";
import { useUI } from "@/contexts/UIContext";
import { useCad } from "@/contexts/CadContext";
import { LeftPanel } from "@/components/LeftPanel";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { FileProjectSection } from "@/features/preview/components/panels/FileProjectSection";
import { StockSceneSection } from "@/features/preview/components/panels/StockSceneSection";
import { FiFolder, FiSliders } from "react-icons/fi";
import { ObjectListPanel } from "@/features/cad-editor";
import type { SketchDocument } from "@/features/cad-editor/model/types";

export function LeftPanelContainer() {
  const { activeTab } = useUI();
  const {
    fileName,
    handleFileChange,
    placementMode,
    setPlacementMode,
    stock,
    setStock,
    showMaterialRemoval,
    setShowMaterialRemoval,
    detailLevel,
    setDetailLevel,
  } = useGCode();
  const {
    resetCamera,
    editDocument,
    setEditDocument,
    selection,
    setSelection,
  } = useCad();

  if (activeTab === "edit") {
    return (
      <LeftPanel>
        <div className="h-full flex flex-col min-h-0">
          <ObjectListPanel
            document={editDocument}
            selection={selection}
            onSelectionChange={setSelection}
            onRenameShape={(id, name) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: prev.shapes.map(s => s.id === id ? { ...s, name } : s)
              }) as SketchDocument);
            }}
            onRenameGroup={(id, name) => {
              setEditDocument(prev => ({
                ...prev,
                groups: prev.groups.map(g => g.id === id ? { ...g, name } : g)
              }) as SketchDocument);
            }}
            onToggleGroupCollapsed={(id) => {
              setEditDocument(prev => ({
                ...prev,
                groups: prev.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
              }) as SketchDocument);
            }}
            onToggleVisibility={(id) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: prev.shapes.map(s => s.id === id ? { ...s, visible: !(s.visible !== false) } : s)
              }) as SketchDocument);
            }}
            onDeleteShape={(id) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: prev.shapes.filter(s => s.id !== id)
              }) as SketchDocument);
            }}
            onReorderShapes={(orderedIds) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: [...prev.shapes].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
              }) as SketchDocument);
            }}
          />
        </div>
      </LeftPanel>
    );
  }

  return (
    <LeftPanel>
      <CollapsibleSection title="Файл проекта" icon={<FiFolder size={18} />}>
        <FileProjectSection
          fileName={fileName}
          onFileChange={handleFileChange}
          onProjectFileChange={() => {}}
          onSaveProject={() => {}}
          onLoadDemo={() => {}}
          onResetCamera={resetCamera}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Заготовка и сцена"
        icon={<FiSliders size={18} />}
        defaultCollapsed={false}
      >
        <StockSceneSection
          placementMode={placementMode}
          onPlacementModeChange={setPlacementMode}
          stock={stock}
          onStockChange={setStock}
          showMaterialRemoval={showMaterialRemoval}
          onShowMaterialRemovalChange={setShowMaterialRemoval}
          detailLevel={detailLevel}
          onDetailLevelChange={setDetailLevel}
        />
      </CollapsibleSection>
    </LeftPanel>
  );
}

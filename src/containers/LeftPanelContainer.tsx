import { useApp } from "@/contexts/AppContext";
import { LeftPanel } from "@/components/LeftPanel";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { FileProjectSection } from "@/features/preview/components/panels/FileProjectSection";
import { PlaybackSection } from "@/features/preview/components/panels/PlaybackSection";
import { StockSceneSection } from "@/features/preview/components/panels/StockSceneSection";
import { FiFolder, FiPlay, FiSliders } from "react-icons/fi";
import { ObjectListPanel } from "@/features/cad-editor";

export function LeftPanelContainer() {
  const {
    activeTab,
    fileName,
    handleFileChange,
    resetCamera,
    playing,
    setPlaying,
    resetPlayback,
    progress,
    setProgress,
    speed,
    setSpeed,
    placementMode,
    setPlacementMode,
    stock,
    setStock,
    showMaterialRemoval,
    setShowMaterialRemoval,
    detailLevel,
    setDetailLevel,
    editDocument,
    setEditDocument,
    selection,
    setSelection,
  } = useApp();

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
              }));
            }}
            onRenameGroup={(id, name) => {
              setEditDocument(prev => ({
                ...prev,
                groups: prev.groups.map(g => g.id === id ? { ...g, name } : g)
              }));
            }}
            onToggleGroupCollapsed={(id) => {
              setEditDocument(prev => ({
                ...prev,
                groups: prev.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
              }));
            }}
            onToggleVisibility={(id) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: prev.shapes.map(s => s.id === id ? { ...s, visible: !(s.visible !== false) } : s)
              }));
            }}
            onDeleteShape={(id) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: prev.shapes.filter(s => s.id !== id)
              }));
            }}
            onReorderShapes={(orderedIds) => {
              setEditDocument(prev => ({
                ...prev,
                shapes: [...prev.shapes].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
              }));
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

      <CollapsibleSection title="Воспроизведение" icon={<FiPlay size={18} />}>
        <PlaybackSection
          playing={playing}
          onPlayPause={() => setPlaying(!playing)}
          onResetPlayback={resetPlayback}
          progress={progress}
          onProgressChange={setProgress}
          speed={speed}
          onSpeedChange={setSpeed}
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

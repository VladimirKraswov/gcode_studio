import { useApp } from "@/contexts/AppContext";
import { LeftPanel } from "@/components/LeftPanel";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { FileProjectSection } from "@/features/preview/components/panels/FileProjectSection";
import { PlaybackSection } from "@/features/preview/components/panels/PlaybackSection";
import { StockSceneSection } from "@/features/preview/components/panels/StockSceneSection";
import { FiFolder, FiPlay, FiSliders } from "react-icons/fi";

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
  } = useApp();

  if (activeTab === "edit") {
    return (
      <LeftPanel>
        <CollapsibleSection title="Объекты CAD" icon={<FiFolder size={18} />}>
          <div className="mt-3 text-[13px] leading-6 text-text-muted">
            В режиме CAD в левой колонке отображается список объектов и групп.
          </div>
        </CollapsibleSection>
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

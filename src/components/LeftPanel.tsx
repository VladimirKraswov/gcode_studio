import type { ChangeEvent } from "react";
import { FiFolder, FiPlay, FiSliders } from "react-icons/fi";
import type { PlacementMode, StockDimensions } from "../types/gcode";
import {
  CollapsibleSection,
  FileProjectSection,
  PlaybackSection,
  StockSceneSection,
} from "./sections";

type LeftPanelMode = "default" | "cad";

type LeftPanelProps = {
  mode?: LeftPanelMode;
  fileName: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProjectFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveProject: () => void;
  onLoadDemo: () => void;
  onResetCamera: () => void;
  playing: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  placementMode: PlacementMode;
  onPlacementModeChange: (mode: PlacementMode) => void;
  stock: StockDimensions;
  onStockChange: (stock: StockDimensions) => void;
  showMaterialRemoval: boolean;
  onShowMaterialRemovalChange: (checked: boolean) => void;
  detailLevel: number;
  onDetailLevelChange: (level: number) => void;
};

export function LeftPanel({
  mode = "default",
  fileName,
  onFileChange,
  onProjectFileChange,
  onSaveProject,
  onLoadDemo,
  onResetCamera,
  playing,
  onPlayPause,
  onResetPlayback,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
  placementMode,
  onPlacementModeChange,
  stock,
  onStockChange,
  showMaterialRemoval,
  onShowMaterialRemovalChange,
  detailLevel,
  onDetailLevelChange,
}: LeftPanelProps) {
  if (mode === "cad") {
    return (
      <div className="flex flex-col gap-4">
        <section className="ui-panel p-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
              <FiFolder size={18} />
            </div>

            <span className="text-base font-semibold text-[var(--color-text)]">
              Объекты CAD
            </span>
          </div>

          <div className="mt-3 text-[13px] leading-6 text-[var(--color-text-muted)]">
            В режиме CAD в левой колонке отображается список объектов и групп.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="Файл проекта" icon={<FiFolder size={18} />}>
        <FileProjectSection
          fileName={fileName}
          onFileChange={onFileChange}
          onProjectFileChange={onProjectFileChange}
          onSaveProject={onSaveProject}
          onLoadDemo={onLoadDemo}
          onResetCamera={onResetCamera}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Воспроизведение" icon={<FiPlay size={18} />}>
        <PlaybackSection
          playing={playing}
          onPlayPause={onPlayPause}
          onResetPlayback={onResetPlayback}
          progress={progress}
          onProgressChange={onProgressChange}
          speed={speed}
          onSpeedChange={onSpeedChange}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Заготовка и сцена"
        icon={<FiSliders size={18} />}
        defaultCollapsed={false}
      >
        <StockSceneSection
          placementMode={placementMode}
          onPlacementModeChange={onPlacementModeChange}
          stock={stock}
          onStockChange={onStockChange}
          showMaterialRemoval={showMaterialRemoval}
          onShowMaterialRemovalChange={onShowMaterialRemovalChange}
          detailLevel={detailLevel}
          onDetailLevelChange={onDetailLevelChange}
        />
      </CollapsibleSection>
    </div>
  );
}
import type { ChangeEvent } from "react";
import { FiFolder, FiPlay, FiSliders } from "react-icons/fi";
import type { PlacementMode, StockDimensions } from "../types/gcode";
import {
  CollapsibleSection,
  FileProjectSection,
  PlaybackSection,
  StockSceneSection,  // <-- добавлен импорт
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ padding: 16, background: "#fff", borderRadius: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: "#dbeafe", display: "grid", placeItems: "center" }}>
              <FiFolder size={18} />
            </div>
            <span>Объекты CAD</span>
          </div>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
            В режиме CAD в левой колонке должен отображаться список объектов и групп.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

      <CollapsibleSection title="Заготовка и сцена" icon={<FiSliders size={18} />} defaultCollapsed={false}>
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
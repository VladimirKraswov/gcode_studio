// src/features/preview/components/PlaybackFooter.tsx
import { FiPlay, FiPause, FiRotateCcw, FiFastForward } from "react-icons/fi";
import { IconButton } from "@/shared/components/ui/IconButton";
import { Slider } from "@/shared/components/ui/Slider";

type PlaybackFooterProps = {
  playing: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
  progress: number;
  onProgressChange: (val: number) => void;
  speed: number;
  onSpeedChange: (val: number) => void;
};

export function PlaybackFooter({
  playing,
  onPlayPause,
  onResetPlayback,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
}: PlaybackFooterProps) {
  return (
    <div className="h-full flex items-center px-4 gap-4">
      <div className="flex items-center gap-1">
        <IconButton
          icon={playing ? <FiPause size={16} /> : <FiPlay size={16} />}
          onClick={onPlayPause}
          title={playing ? "Пауза" : "Запуск"}
          variant={playing ? "primary" : "ghost"}
          className="w-8 h-8"
        />
        <IconButton
          icon={<FiRotateCcw size={16} />}
          onClick={onResetPlayback}
          title="Сброс"
          className="w-8 h-8"
        />
      </div>

      <div className="flex-1 flex items-center gap-3">
        <span className="text-[11px] font-mono text-text-muted w-10">
          {(progress * 100).toFixed(1)}%
        </span>
        <Slider
          value={progress}
          onChange={onProgressChange}
          min={0}
          max={1}
          step={0.001}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-3 min-w-[140px]">
        <FiFastForward size={14} className="text-text-muted" />
        <Slider
          value={speed}
          onChange={onSpeedChange}
          min={0.1}
          max={10}
          step={0.1}
          className="w-20"
        />
        <span className="text-[11px] font-medium text-text-muted w-8">
          {speed.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}

import {
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiFastForward,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/shared/components/ui/IconButton";
import { Slider } from "@/shared/components/ui/Slider";

type PlaybackFooterProps = {
  playing: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
  progress: number; // 0..100
  onProgressChange: (val: number) => void;
  speed: number;
  onSpeedChange: (val: number) => void;
  showToolpath: boolean;
  onToggleToolpath: () => void;
};

export function PlaybackFooter({
  playing,
  onPlayPause,
  onResetPlayback,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
  showToolpath,
  onToggleToolpath,
}: PlaybackFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="h-full flex items-center px-4 gap-4">
      <div className="flex items-center gap-1">
        <IconButton
          icon={playing ? <FiPause size={16} /> : <FiPlay size={16} />}
          onClick={onPlayPause}
          title={playing ? t("preview.pause") : t("preview.play")}
          variant={playing ? "primary" : "ghost"}
          className="w-8 h-8"
        />
        <IconButton
          icon={<FiRotateCcw size={16} />}
          onClick={onResetPlayback}
          title={t("preview.reset")}
          className="w-8 h-8"
        />
        <IconButton
          icon={showToolpath ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          onClick={onToggleToolpath}
          title={showToolpath ? t("preview.hide_toolpath") : t("preview.show_toolpath")}
          variant={showToolpath ? "primary" : "ghost"}
          className="w-8 h-8"
        />
      </div>

      <div className="flex-1 flex items-center gap-3">
        <span className="text-[11px] font-mono text-text-muted w-12">
          {progress.toFixed(1)}%
        </span>
        <Slider
          value={progress}
          onChange={onProgressChange}
          min={0}
          max={100}
          step={0.1}
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
        <span className="text-[11px] font-medium text-text-muted w-10">
          {speed.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}
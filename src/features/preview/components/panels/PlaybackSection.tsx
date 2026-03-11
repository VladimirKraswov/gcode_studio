import { FiPause, FiPlay, FiSkipBack } from "react-icons/fi";
import { RangeCard } from "./RangeCard";

type PlaybackSectionProps = {
  playing: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;
};

export function PlaybackSection({
  playing,
  onPlayPause,
  onResetPlayback,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
}: PlaybackSectionProps) {
  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onPlayPause} className="ui-btn-primary">
          {playing ? <FiPause size={15} /> : <FiPlay size={15} />}
          {playing ? "Пауза" : "Старт"}
        </button>

        <button type="button" onClick={onResetPlayback} className="ui-btn-ghost">
          <FiSkipBack size={15} />
          С начала
        </button>
      </div>

      <RangeCard
        label="Прогресс"
        value={`${progress.toFixed(1)}%`}
        min={0}
        max={100}
        step={0.1}
        current={progress}
        onChange={onProgressChange}
      />

      <RangeCard
        label="Скорость"
        value={`${speed.toFixed(1)}x`}
        min={0.2}
        max={5}
        step={0.1}
        current={speed}
        onChange={onSpeedChange}
      />
    </>
  );
}
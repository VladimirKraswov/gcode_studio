import { FiPause, FiPlay, FiSkipBack } from "react-icons/fi";
import { ui } from "../../styles/ui";
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button type="button" onClick={onPlayPause} style={ui.buttonPrimary}>
          {playing ? <FiPause size={15} /> : <FiPlay size={15} />}
          {playing ? "Пауза" : "Старт"}
        </button>
        <button type="button" onClick={onResetPlayback} style={ui.buttonGhost}>
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
import { useEffect, useState } from "react";
import { clamp } from "@/shared/utils/common";

export function usePlayback() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = clamp(prev + 0.2 * speed, 0, 100);

        if (next >= 100) {
          setPlaying(false);
          return 100;
        }

        return next;
      });
    }, 16);

    return () => window.clearInterval(id);
  }, [playing, speed]);

  function resetPlayback() {
    setPlaying(false);
    setProgress(0);
  }

  return {
    progress,
    setProgress,
    playing,
    setPlaying,
    speed,
    setSpeed,
    resetPlayback,
  };
}
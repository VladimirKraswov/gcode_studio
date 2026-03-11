import { useState, useCallback } from "react";
import type { CameraInfo } from "@/types/gcode";

export function useSceneState() {
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);

  const resetCamera = useCallback(() => {
    setCameraResetKey((v) => v + 1);
  }, []);

  return {
    cameraResetKey,
    setCameraResetKey,
    cameraInfo,
    setCameraInfo,
    resetCamera,
  };
}

import React, { useCallback } from "react";
import { usePlayback } from "@/features/preview/hooks/usePlayback";

export function useGCodeFile(
  setSource: (src: string) => void,
  setFileName: (name: string) => void,
  setActiveTab: (tab: any) => void,
  setCameraResetKey: React.Dispatch<React.SetStateAction<number>>
) {
  const { resetPlayback } = usePlayback();

  const applyGeneratedGCode = useCallback((gcode: string) => {
    setSource(gcode);
    setFileName("edit-generated.gcode");
    setActiveTab("gcode");
    resetPlayback();
    setCameraResetKey((value) => value + 1);
  }, [setSource, setFileName, setActiveTab, resetPlayback, setCameraResetKey]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSource(text || "");
    setFileName(file.name || "loaded.gcode");
    resetPlayback();
    setCameraResetKey((v) => v + 1);
  }, [setSource, setFileName, resetPlayback, setCameraResetKey]);

  return {
    applyGeneratedGCode,
    handleFileChange,
  };
}

import { createContext, useContext, type ReactNode } from "react";
import { type StockDimensions, type PlacementMode, type CurrentState } from "@/types/gcode";
import { type ParsedGCode } from "@/features/gcode-editor/hooks/useGCodeWorker";

export interface GCodeContextValue {
  source: string;
  setSource: (source: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  parsed: ParsedGCode | null;
  isParsing: boolean;
  progress: number;
  setProgress: (progress: number) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  resetPlayback: () => void;
  currentState: CurrentState;
  stock: StockDimensions;
  setStock: (stock: StockDimensions) => void;
  showMaterialRemoval: boolean;
  setShowMaterialRemoval: (show: boolean) => void;
  placementMode: PlacementMode;
  setPlacementMode: (mode: PlacementMode) => void;
  detailLevel: number;
  setDetailLevel: (level: number) => void;
  applyGeneratedGCode: (gcode: string) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GCodeContext = createContext<GCodeContextValue | undefined>(undefined);

export function GCodeProvider({ children, value }: { children: ReactNode; value: GCodeContextValue }) {
  return <GCodeContext.Provider value={value}>{children}</GCodeContext.Provider>;
}

export function useGCode() {
  const context = useContext(GCodeContext);
  if (context === undefined) {
    throw new Error("useGCode must be used within a GCodeProvider");
  }
  return context;
}

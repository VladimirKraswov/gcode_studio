import type { CameraInfo, CurrentState, ParsedStats, Bounds, StockDimensions } from "../types/gcode";
import { InfoPanelSection } from "./sections";

type RightInfoPanelProps = {
  bounds: Bounds;
  stock: StockDimensions;
  parsedStats: ParsedStats;
  currentState: CurrentState;
  cameraInfo: CameraInfo | null;
  totalLength: number;
};

export function RightInfoPanel(props: RightInfoPanelProps) {
  return <InfoPanelSection {...props} />;
}
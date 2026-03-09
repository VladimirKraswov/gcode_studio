import type { ParsedStats } from "../types/gcode";
import { GCodeStatsSection } from "./sections";

type GCodeRightPanelProps = {
  stats: ParsedStats;
  totalLength: number;
};

export function GCodeRightPanel(props: GCodeRightPanelProps) {
  return <GCodeStatsSection {...props} />;
}
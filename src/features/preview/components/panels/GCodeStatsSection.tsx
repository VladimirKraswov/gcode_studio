import { FiActivity, FiFileText, FiMove, FiScissors, FiTrendingUp } from "react-icons/fi";
import type { ParsedGCode } from "@/types/gcode";
import { fmt } from "@/shared/utils/common";

export type GCodeStatsSectionProps = {
  parsed?: ParsedGCode;
  stats?: any; // Fallback
  totalLength?: number;
};

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="ui-stat-card flex items-center gap-3 p-3.5">
      <div className="w-9 h-9 rounded-xl bg-panel-muted text-text-soft grid place-items-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="ui-stat-label">{label}</div>
        <div className="ui-stat-value text-base">{value}</div>
      </div>
    </div>
  );
}

export function GCodeStatsSection({ parsed }: GCodeStatsSectionProps) {
  if (!parsed) return null;
  const { stats, totalLength } = parsed;

  return (
    <div className="grid gap-2.5">
      <StatItem icon={<FiFileText size={16} />} label="Всего строк" value={stats.totalLines} />
      <StatItem icon={<FiMove size={16} />} label="Перемещений" value={stats.totalMoves} />
      <StatItem icon={<FiTrendingUp size={16} />} label="Холостых (G0)" value={stats.rapidMoves} />
      <StatItem icon={<FiScissors size={16} />} label="Рабочих (G1)" value={stats.workMoves} />
      <StatItem icon={<FiActivity size={16} />} label="Длина пути" value={`${fmt(totalLength)} мм`} />
    </div>
  );
}

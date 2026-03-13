import { FiActivity, FiFileText, FiMove, FiScissors, FiTrendingUp } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { ParsedGCode } from "@/types/gcode";
import { fmt } from "@/shared/utils/common";

export type GCodeStatsSectionProps = {
  parsed?: ParsedGCode;
};

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-panel-muted/30 border border-border/50">
      <div className="w-8 h-8 rounded-md bg-panel-solid text-primary grid place-items-center flex-shrink-0 shadow-sm border border-border/50">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase font-bold text-text-muted tracking-tight leading-none mb-1">{label}</div>
        <div className="text-[14px] font-bold text-text leading-none">{value}</div>
      </div>
    </div>
  );
}

export function GCodeStatsSection({ parsed }: GCodeStatsSectionProps) {
  const { t } = useTranslation();
  if (!parsed) return null;
  const { stats, totalLength } = parsed;

  return (
    <div className="flex flex-col gap-2 p-1">
      <StatItem icon={<FiFileText size={16} />} label={t("common.total_lines")} value={stats.totalLines} />
      <StatItem icon={<FiMove size={16} />} label={t("common.total_moves")} value={stats.totalMoves} />
      <StatItem icon={<FiTrendingUp size={16} />} label={t("common.rapid_moves_g0")} value={stats.rapidMoves} />
      <StatItem icon={<FiScissors size={16} />} label={t("common.work_moves_g1")} value={stats.workMoves} />
      <StatItem icon={<FiActivity size={16} />} label={t("common.path_length")} value={`${fmt(totalLength)} mm`} />
    </div>
  );
}

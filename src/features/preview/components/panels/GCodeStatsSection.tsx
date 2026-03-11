import { FiActivity, FiFileText, FiMove, FiScissors, FiTrendingUp } from "react-icons/fi";
import type { ParsedStats } from "@/types/gcode";
import { fmt } from "@/shared/utils/common";

type GCodeStatsSectionProps = {
  stats: ParsedStats;
  totalLength: number;
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

export function GCodeStatsSection({ stats, totalLength }: GCodeStatsSectionProps) {
  return (
    <div className="ui-panel p-4">
      <div className="ui-section-title mb-3.5">
        <div className="ui-icon-badge">
          <FiActivity size={18} />
        </div>
        <span>Статистика G‑code</span>
      </div>

      <div className="grid gap-2.5">
        <StatItem icon={<FiFileText size={16} />} label="Всего строк" value={stats.totalLines} />
        <StatItem icon={<FiMove size={16} />} label="Перемещений (G0/G1)" value={stats.totalMoves} />
        <StatItem icon={<FiTrendingUp size={16} />} label="Холостых (G0)" value={stats.rapidMoves} />
        <StatItem icon={<FiScissors size={16} />} label="Рабочих (G1)" value={stats.workMoves} />
        <StatItem icon={<FiScissors size={16} />} label="Режущих" value={stats.cuttingMoves} />
        <StatItem icon={<FiActivity size={16} />} label="Длина пути" value={`${fmt(totalLength)} мм`} />
      </div>

      <div className="ui-panel-inset p-3 mt-3.5 text-sm text-text-muted leading-relaxed">
        Подсказка: быстрые команды в редакторе вставляются в текущую позицию курсора.
      </div>
    </div>
  );
}
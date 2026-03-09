import { FiActivity, FiFileText, FiMove, FiScissors, FiTrendingUp } from "react-icons/fi";
import type { ParsedStats } from "../../types/gcode";
import { fmt } from "../../utils";
import { useStyles } from "../../styles/useStyles";
import { useTheme } from "../../contexts/ThemeContext";

type GCodeStatsSectionProps = {
  stats: ParsedStats;
  totalLength: number;
};

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div
      style={{
        ...styles.statCard,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: theme.panelMuted,
          color: theme.textSoft,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.statLabel}>{label}</div>
        <div style={{ ...styles.statValue, fontSize: 16 }}>{value}</div>
      </div>
    </div>
  );
}

export function GCodeStatsSection({ stats, totalLength }: GCodeStatsSectionProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div style={{ ...styles.panel, padding: 16 }}>
      <div style={styles.panelHeader}>
        <h3 style={styles.sectionTitle}>
          <div style={styles.iconBadge}>
            <FiActivity size={18} />
          </div>
          <span>Статистика G‑code</span>
        </h3>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <StatItem icon={<FiFileText size={16} />} label="Всего строк" value={stats.totalLines} />
        <StatItem icon={<FiMove size={16} />} label="Перемещений (G0/G1)" value={stats.totalMoves} />
        <StatItem icon={<FiTrendingUp size={16} />} label="Холостых (G0)" value={stats.rapidMoves} />
        <StatItem icon={<FiScissors size={16} />} label="Рабочих (G1)" value={stats.workMoves} />
        <StatItem icon={<FiScissors size={16} />} label="Режущих" value={stats.cuttingMoves} />
        <StatItem icon={<FiActivity size={16} />} label="Длина пути" value={`${fmt(totalLength)} мм`} />
      </div>

      <div
        style={{
          ...styles.panelInset,
          marginTop: 14,
          padding: 12,
          color: theme.textMuted,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Подсказка: быстрые команды в редакторе вставляются в текущую позицию курсора.
      </div>
    </div>
  );
}
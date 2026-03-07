import {
  FiActivity,
  FiCamera,
  FiCrosshair,
  FiMaximize2,
  FiMove,
} from "react-icons/fi";
import type {
  CameraInfo,
  CurrentState,
  ParsedStats,
  Bounds,
  StockDimensions,
} from "../types/gcode";
import { fmt } from "../utils";
import { ui, theme } from "../styles/ui";

type RightInfoPanelProps = {
  bounds: Bounds;
  stock: StockDimensions;
  parsedStats: ParsedStats;
  currentState: CurrentState;
  cameraInfo: CameraInfo | null;
  totalLength: number;
};

export function RightInfoPanel({
  bounds,
  stock,
  parsedStats,
  currentState,
  cameraInfo,
  totalLength,
}: RightInfoPanelProps) {
  return (
    <div style={{ ...ui.panel, padding: 16 }}>
      <div style={ui.panelHeader}>
        <h3 style={ui.sectionTitle}>
          <div style={ui.iconBadge}>
            <FiActivity size={18} />
          </div>
          <span>Информация</span>
        </h3>
      </div>

      <PanelGroup
        title="Размеры и статистика"
        icon={<FiMaximize2 size={16} />}
      >
        <StatGrid>
          <MiniStat label="X" value={`${fmt(bounds.minX)} .. ${fmt(bounds.maxX)} мм`} />
          <MiniStat label="Y" value={`${fmt(bounds.minY)} .. ${fmt(bounds.maxY)} мм`} />
          <MiniStat label="Z" value={`${fmt(bounds.minZ)} .. ${fmt(bounds.maxZ)} мм`} />
          <MiniStat
            label="Заготовка"
            value={`${fmt(stock.width)} × ${fmt(stock.height)} × ${fmt(stock.thickness)} мм`}
          />
          <MiniStat label="Движений" value={String(parsedStats.totalMoves)} />
          <MiniStat label="G0" value={String(parsedStats.rapidMoves)} />
          <MiniStat label="G1" value={String(parsedStats.workMoves)} />
          <MiniStat label="Режущих" value={String(parsedStats.cuttingMoves)} />
          <MiniStat label="Длина пути" value={`${fmt(totalLength)} мм`} />
          <MiniStat label="Render segments" value={String(parsedStats.renderMoves)} />
        </StatGrid>
      </PanelGroup>

      <PanelGroup
        title="Состояние инструмента"
        icon={<FiMove size={16} />}
      >
        <StatGrid>
          <MiniStat label="X" value={`${fmt(currentState.position.x)} мм`} />
          <MiniStat label="Y" value={`${fmt(currentState.position.y)} мм`} />
          <MiniStat label="Z" value={`${fmt(currentState.position.z)} мм`} />
          <MiniStat label="Команда" value={currentState.mode} />
          <MiniStat label="Строка" value={String(currentState.lineNumber)} />
        </StatGrid>

        <div style={{ marginTop: 10, ...ui.statCard }}>
          <div style={ui.statLabel}>Текущая строка G-code</div>
          <div
            style={{
              ...ui.statValue,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 14,
              wordBreak: "break-word",
            }}
          >
            {currentState.segment ? currentState.segment.raw : "-"}
          </div>
        </div>
      </PanelGroup>

      <PanelGroup title="Камера" icon={<FiCamera size={16} />}>
        {cameraInfo ? (
          <div style={{ display: "grid", gap: 10 }}>
            <MiniStat
              label="Позиция"
              value={`${cameraInfo.position.x.toFixed(1)}, ${cameraInfo.position.y.toFixed(
                1,
              )}, ${cameraInfo.position.z.toFixed(1)}`}
            />
            <MiniStat
              label="Цель"
              value={`${cameraInfo.target.x.toFixed(1)}, ${cameraInfo.target.y.toFixed(
                1,
              )}, ${cameraInfo.target.z.toFixed(1)}`}
            />
          </div>
        ) : (
          <div style={{ ...ui.panelInset, padding: 12, color: theme.textMuted }}>
            Нет данных камеры
          </div>
        )}
      </PanelGroup>
    </div>
  );
}

function PanelGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          fontSize: 13,
          fontWeight: 800,
          color: theme.text,
        }}
      >
        <FiCrosshair size={14} style={{ opacity: 0, width: 0 }} />
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={ui.statCard}>
      <div style={ui.statLabel}>{label}</div>
      <div
        style={{
          ...ui.statValue,
          fontSize: 15,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}
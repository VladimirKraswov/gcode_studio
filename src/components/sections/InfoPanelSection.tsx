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
} from "../../types/gcode";
import { fmt } from "../../utils";

type InfoPanelSectionProps = {
  bounds: Bounds;
  stock: StockDimensions;
  parsedStats: ParsedStats;
  currentState: CurrentState;
  cameraInfo: CameraInfo | null;
  totalLength: number;
};

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
    <section className="mb-[18px]">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-extrabold text-[var(--color-text)]">
        <FiCrosshair size={14} className="w-0 opacity-0" />
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-stat-card">
      <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="break-words text-[15px] font-extrabold text-[var(--color-text)]">
        {value}
      </div>
    </div>
  );
}

export function InfoPanelSection({
  bounds,
  stock,
  parsedStats,
  currentState,
  cameraInfo,
  totalLength,
}: InfoPanelSectionProps) {
  return (
    <div className="ui-panel p-4">
      <div className="mb-[14px] flex items-center justify-between gap-3">
        <h3 className="m-0 flex items-center gap-2.5 text-base font-bold text-[var(--color-text)]">
          <div className="ui-icon-badge">
            <FiActivity size={18} />
          </div>
          <span>Информация</span>
        </h3>
      </div>

      <PanelGroup title="Размеры и статистика" icon={<FiMaximize2 size={16} />}>
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

      <PanelGroup title="Состояние инструмента" icon={<FiMove size={16} />}>
        <StatGrid>
          <MiniStat label="X" value={`${fmt(currentState.position.x)} мм`} />
          <MiniStat label="Y" value={`${fmt(currentState.position.y)} мм`} />
          <MiniStat label="Z" value={`${fmt(currentState.position.z)} мм`} />
          <MiniStat label="Команда" value={currentState.mode} />
          <MiniStat label="Строка" value={String(currentState.lineNumber)} />
        </StatGrid>

        <div className="ui-stat-card mt-2.5">
          <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">
            Текущая строка G-code
          </div>
          <div className="break-words font-mono text-sm font-extrabold text-[var(--color-text)]">
            {currentState.segment ? currentState.segment.raw : "-"}
          </div>
        </div>
      </PanelGroup>

      <PanelGroup title="Камера" icon={<FiCamera size={16} />}>
        {cameraInfo ? (
          <div className="grid gap-2.5">
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
          <div className="ui-panel-inset p-3 text-[var(--color-text-muted)]">
            Нет данных камеры
          </div>
        )}
      </PanelGroup>
    </div>
  );
}
import {
  FiCamera,
  FiMaximize2,
  FiMove,
} from "react-icons/fi";
import type {
  CameraInfo,
  CurrentState,
  ParsedStats,
  Bounds,
  StockDimensions,
} from "@/types/gcode";
import { fmt } from "@/shared/utils/common";

type InfoPanelSectionProps = {
  bounds: Bounds;
  stock: StockDimensions;
  parsedStats: ParsedStats;
  currentState: CurrentState;
  cameraInfo: CameraInfo | null;
  totalLength: number;
};

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
      <div className="text-primary">{icon}</div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{title}</span>
    </div>
  );
}

function MiniStat({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`p-2 rounded-lg bg-panel-muted/50 border border-border/50 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="text-[10px] text-text-muted font-medium mb-0.5">{label}</div>
      <div className="text-[13px] font-bold text-text truncate">
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
    <div className="flex flex-col gap-1 p-1">
      <SectionHeader title="Размеры и статистика" icon={<FiMaximize2 size={14} />} />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="X (Границы)" value={`${fmt(bounds.minX)} .. ${fmt(bounds.maxX)}`} />
        <MiniStat label="Y (Границы)" value={`${fmt(bounds.minY)} .. ${fmt(bounds.maxY)}`} />
        <MiniStat label="Z (Границы)" value={`${fmt(bounds.minZ)} .. ${fmt(bounds.maxZ)}`} />
        <MiniStat label="Длина пути" value={`${fmt(totalLength)} мм`} />
        <MiniStat label="Всего строк" value={String(parsedStats.totalMoves)} />
        <MiniStat label="G0 / G1" value={`${parsedStats.rapidMoves} / ${parsedStats.workMoves}`} />
        <MiniStat
          fullWidth
          label="Заготовка"
          value={`${fmt(stock.width)} × ${fmt(stock.height)} × ${fmt(stock.thickness)} мм`}
        />
      </div>

      <SectionHeader title="Состояние инструмента" icon={<FiMove size={14} />} />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Позиция X" value={`${fmt(currentState.position.x)}`} />
        <MiniStat label="Позиция Y" value={`${fmt(currentState.position.y)}`} />
        <MiniStat label="Позиция Z" value={`${fmt(currentState.position.z)}`} />
        <MiniStat label="Строка" value={String(currentState.lineNumber)} />

        <div className="col-span-2 p-2 rounded-lg bg-primary-soft/20 border border-primary-soft/30">
          <div className="text-[10px] text-primary font-bold mb-1 uppercase tracking-tight">Активная команда</div>
          <div className="font-mono text-[12px] font-bold text-text break-all">
            {currentState.segment ? currentState.segment.raw : "-"}
          </div>
        </div>
      </div>

      <SectionHeader title="Камера" icon={<FiCamera size={14} />} />
      {cameraInfo ? (
        <div className="grid grid-cols-2 gap-2">
          <MiniStat
            label="Позиция"
            value={`${cameraInfo.position.x.toFixed(0)}, ${cameraInfo.position.y.toFixed(0)}, ${cameraInfo.position.z.toFixed(0)}`}
          />
          <MiniStat
            label="Цель"
            value={`${cameraInfo.target.x.toFixed(0)}, ${cameraInfo.target.y.toFixed(0)}, ${cameraInfo.target.z.toFixed(0)}`}
          />
        </div>
      ) : (
        <div className="p-3 text-center rounded-lg border border-dashed border-border text-text-muted text-[11px]">
          Нет данных
        </div>
      )}
    </div>
  );
}

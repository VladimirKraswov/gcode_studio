import {
  FiCamera,
  FiMaximize2,
  FiMove,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1 p-1">
      <SectionHeader title={t("common.dimensions_stats")} icon={<FiMaximize2 size={14} />} />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label={`X (${t("common.bounds")})`} value={`${fmt(bounds.minX)} .. ${fmt(bounds.maxX)}`} />
        <MiniStat label={`Y (${t("common.bounds")})`} value={`${fmt(bounds.minY)} .. ${fmt(bounds.maxY)}`} />
        <MiniStat label={`Z (${t("common.bounds")})`} value={`${fmt(bounds.minZ)} .. ${fmt(bounds.maxZ)}`} />
        <MiniStat label={t("common.path_length")} value={`${fmt(totalLength)} mm`} />
        <MiniStat label={t("common.total_lines")} value={String(parsedStats.totalMoves)} />
        <MiniStat label="G0 / G1" value={`${parsedStats.rapidMoves} / ${parsedStats.workMoves}`} />
        <MiniStat
          fullWidth
          label={t("common.stock")}
          value={`${fmt(stock.width)} × ${fmt(stock.height)} × ${fmt(stock.thickness)} mm`}
        />
      </div>

      <SectionHeader title={t("common.tool_state")} icon={<FiMove size={14} />} />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label={`${t("common.position")} X`} value={`${fmt(currentState.position.x)}`} />
        <MiniStat label={`${t("common.position")} Y`} value={`${fmt(currentState.position.y)}`} />
        <MiniStat label={`${t("common.position")} Z`} value={`${fmt(currentState.position.z)}`} />
        <MiniStat label={t("common.line")} value={String(currentState.lineNumber)} />

        <div className="col-span-2 p-2 rounded-lg bg-primary-soft/20 border border-primary-soft/30">
          <div className="text-[10px] text-primary font-bold mb-1 uppercase tracking-tight">{t("common.active_command")}</div>
          <div className="font-mono text-[12px] font-bold text-text break-all">
            {currentState.segment ? currentState.segment.raw : "-"}
          </div>
        </div>
      </div>

      <SectionHeader title={t("common.camera")} icon={<FiCamera size={14} />} />
      {cameraInfo ? (
        <div className="grid grid-cols-2 gap-2">
          <MiniStat
            label={t("common.position")}
            value={`${cameraInfo.position.x.toFixed(0)}, ${cameraInfo.position.y.toFixed(0)}, ${cameraInfo.position.z.toFixed(0)}`}
          />
          <MiniStat
            label={t("common.camera_target")}
            value={`${cameraInfo.target.x.toFixed(0)}, ${cameraInfo.target.y.toFixed(0)}, ${cameraInfo.target.z.toFixed(0)}`}
          />
        </div>
      ) : (
        <div className="p-3 text-center rounded-lg border border-dashed border-border text-text-muted text-[11px]">
          {t("common.no_data")}
        </div>
      )}
    </div>
  );
}

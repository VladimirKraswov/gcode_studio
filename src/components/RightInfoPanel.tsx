import { StatCard } from "./StatCard";
import type { CameraInfo, CurrentState, ParsedStats, Bounds, StockDimensions } from "../types/gcode";
import { fmt } from "../utils";

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
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        height: "fit-content",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Информация</h3>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Размеры и статистика</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatCard label="X" value={`${fmt(bounds.minX)} .. ${fmt(bounds.maxX)} мм`} />
          <StatCard label="Y" value={`${fmt(bounds.minY)} .. ${fmt(bounds.maxY)} мм`} />
          <StatCard label="Z" value={`${fmt(bounds.minZ)} .. ${fmt(bounds.maxZ)} мм`} />
          <StatCard
            label="Заготовка"
            value={`${fmt(stock.width)} × ${fmt(stock.height)} × ${fmt(stock.thickness)} мм`}
          />
          <StatCard label="Движений" value={String(parsedStats.totalMoves)} />
          <StatCard label="G0" value={String(parsedStats.rapidMoves)} />
          <StatCard label="G1" value={String(parsedStats.workMoves)} />
          <StatCard label="Режущих" value={String(parsedStats.cuttingMoves)} />
          <StatCard label="Длина пути" value={`${fmt(totalLength)} мм`} />
          <StatCard label="Render segments" value={String(parsedStats.renderMoves)} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Состояние инструмента</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatCard label="X" value={`${fmt(currentState.position.x)} мм`} />
          <StatCard label="Y" value={`${fmt(currentState.position.y)} мм`} />
          <StatCard label="Z" value={`${fmt(currentState.position.z)} мм`} />
          <StatCard label="Команда" value={currentState.mode} />
          <StatCard label="Строка" value={String(currentState.lineNumber)} />
        </div>

        <div style={{ marginTop: 10 }}>
          <StatCard
            label="Текущая строка G-code"
            value={currentState.segment ? currentState.segment.raw : "-"}
            mono
          />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: 12 }}>Камера</h4>
        {cameraInfo ? (
          <>
            <div>
              Позиция: {cameraInfo.position.x.toFixed(1)}, {cameraInfo.position.y.toFixed(1)},{" "}
              {cameraInfo.position.z.toFixed(1)}
            </div>
            <div>
              Цель: {cameraInfo.target.x.toFixed(1)}, {cameraInfo.target.y.toFixed(1)},{" "}
              {cameraInfo.target.z.toFixed(1)}
            </div>
          </>
        ) : (
          <div>N/A</div>
        )}
      </div>
    </div>
  );
}
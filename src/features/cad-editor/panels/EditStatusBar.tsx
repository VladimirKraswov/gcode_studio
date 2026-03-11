import type { SketchTool } from "../model/types";

type EditStatusBarProps = {
  objectCount: number;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isTransforming: boolean;
  hasDraft: boolean;
};

export function EditStatusBar({
  objectCount,
  tool,
  isDragging,
  isPanning,
  isTransforming,
  hasDraft,
}: EditStatusBarProps) {
  const interactionLabel = isTransforming
    ? "Трансформация"
    : isDragging
      ? "Перемещение"
      : isPanning
        ? "Навигация"
        : tool === "select"
          ? "Выбор"
          : "Рисование";

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-panel border-t border-border text-[11px] text-text-muted select-none">
      <div className="flex items-center gap-4">
        <span className="font-medium text-text-soft uppercase tracking-wider">{interactionLabel}</span>
        <span className="h-3 w-px bg-border" />
        <span>Объектов: {objectCount}</span>
      </div>

      <div className="flex items-center gap-3">
        {hasDraft && <span className="text-primary font-bold animate-pulse">Рисование активно...</span>}
        <span>Tool: <span className="text-text-soft font-semibold capitalize">{tool}</span></span>
      </div>
    </div>
  );
}

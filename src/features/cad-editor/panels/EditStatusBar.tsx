import type { SketchTool } from "../model/types";
import { Badge } from "@/shared/components/ui/Badge";

type EditStatusBarProps = {
  objectCount: number;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isTransforming: boolean;
  hasDraft: boolean;
  dof?: number;
};

export function EditStatusBar({
  objectCount,
  tool,
  isDragging,
  isPanning,
  isTransforming,
  hasDraft,
  dof,
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

  const getStatusVariant = () => {
    if (isTransforming || isDragging) return "warning";
    if (hasDraft) return "primary";
    return "ghost";
  };

  return (
    <div className="flex items-center justify-between px-3 h-full text-[11px] text-text-muted select-none">
      <div className="flex items-center gap-3">
        <Badge variant={getStatusVariant()} className="px-1.5 py-0 rounded-sm font-bold uppercase tracking-tighter">
          {interactionLabel}
        </Badge>
        <span className="h-3 w-px bg-border" />
        <span className="font-medium">Объектов в сцене: <span className="text-text">{objectCount}</span></span>
        {typeof dof === "number" && (
           <>
             <span className="h-3 w-px bg-border" />
             <span className="font-medium">DoF: <span className={dof === 0 ? "text-success font-bold" : "text-primary font-bold"}>{dof}</span></span>
           </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasDraft && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-bold">Ожидание завершения контура</span>
          </div>
        )}
        <span className="h-3 w-px bg-border" />
        <span>Активный инструмент: <span className="text-text font-bold capitalize">{tool}</span></span>
      </div>
    </div>
  );
}

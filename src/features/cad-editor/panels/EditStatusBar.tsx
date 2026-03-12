import type { SketchTool } from "../model/types";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { Badge } from "@/shared/components/ui/Badge";
import { useUI } from "@/contexts/UIContext";

type BadgeVariant = "primary" | "warning" | "danger" | "ghost" | "success";

type EditStatusBarProps = {
  objectCount: number;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isTransforming: boolean;
  hasDraft: boolean;
  dof?: number;
  solveState?: SketchSolveState;
  issueCount?: number;
};

function solveStateLabel(state?: SketchSolveState): string {
  switch (state) {
    case "well-defined":
      return "Полностью определён";
    case "underdefined":
      return "Недоопределён";
    case "overdefined":
      return "Переопределён";
    case "conflicting":
      return "Конфликт ограничений";
    default:
      return "Без анализа";
  }
}

function solveStateBadgeVariant(state?: SketchSolveState): BadgeVariant {
  switch (state) {
    case "well-defined":
      return "success";
    case "underdefined":
      return "warning";
    case "overdefined":
    case "conflicting":
      return "danger";
    default:
      return "ghost";
  }
}

function getInteractionBadgeVariant(params: {
  isDragging: boolean;
  isTransforming: boolean;
  hasDraft: boolean;
}): BadgeVariant {
  const { isDragging, isTransforming, hasDraft } = params;

  if (isTransforming || isDragging) return "warning";
  if (hasDraft) return "primary";
  return "ghost";
}

function getDofClassName(solveState?: SketchSolveState): string {
  switch (solveState) {
    case "well-defined":
      return "text-success font-bold";
    case "overdefined":
    case "conflicting":
      return "text-danger font-bold";
    default:
      return "text-primary font-bold";
  }
}

export function EditStatusBar({
  objectCount,
  tool,
  isDragging,
  isPanning,
  isTransforming,
  hasDraft,
  dof,
  solveState,
  issueCount = 0,
}: EditStatusBarProps) {
  const { hint } = useUI();
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
    <div className="flex items-center justify-between px-3 h-full text-[11px] text-text-muted select-none">
      <div className="flex items-center gap-3">
        <Badge
          variant={getInteractionBadgeVariant({
            isDragging,
            isTransforming,
            hasDraft,
          })}
          className="px-1.5 py-0 rounded-sm font-bold uppercase tracking-tighter"
        >
          {interactionLabel}
        </Badge>

        <span className="h-3 w-px bg-border" />

        <span className="font-medium">
          Объектов в сцене: <span className="text-text">{objectCount}</span>
        </span>

        {typeof dof === "number" && (
          <>
            <span className="h-3 w-px bg-border" />
            <span className="font-medium">
              DoF: <span className={getDofClassName(solveState)}>{dof}</span>
            </span>
          </>
        )}

        {solveState && (
          <>
            <span className="h-3 w-px bg-border" />
            <Badge
              variant={solveStateBadgeVariant(solveState)}
              className="px-1.5 py-0 rounded-sm font-bold"
            >
              {solveStateLabel(solveState)}
            </Badge>
          </>
        )}

        {issueCount > 0 && (
          <>
            <span className="h-3 w-px bg-border" />
            <span className="font-medium">
              Проблем: <span className="text-danger font-bold">{issueCount}</span>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasDraft && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-bold">
              Ожидание завершения контура
            </span>
          </div>
        )}

        <span className="h-3 w-px bg-border" />

        {hint && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary font-bold uppercase tracking-widest">{hint}</span>
            </div>
        )}

        {!hint && (
            <span>
                Активный инструмент:{" "}
                <span className="text-text font-bold capitalize">{tool}</span>
            </span>
        )}
      </div>
    </div>
  );
}
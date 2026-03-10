import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  FiCheck,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiImage,
  FiLayers,
  FiMaximize,
  FiPlay,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type { MirrorAxis, SketchTool } from "../model/types";
import { useToolPlugins } from "../plugins/registry";

type EditToolbarProps = {
  tool: SketchTool;
  onToolChange: (tool: SketchTool) => void;
  onStartLinearArray: () => void;
  onStartCircularArray: () => void;
  onCommitPolyline: () => void;
  onCancelDraft: () => void;
  onDeleteSelected: () => void;
  onResetView: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onImportSvg: (file: File) => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onCloneSelected: () => void;
  onMirrorSelected: (axis: MirrorAxis) => void;
  canGroupSelected: boolean;
  canUngroupSelected: boolean;
  hasSelection: boolean;
  hasDraft: boolean;
};

type ToolbarButtonProps = {
  title: string;
  ariaLabel?: string;
  active?: boolean;
  success?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
};

function ToolbarButton({
  title,
  ariaLabel,
  active = false,
  success = false,
  disabled = false,
  danger = false,
  onClick,
  children,
  style,
}: ToolbarButtonProps) {
  const variantClass = active
    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]"
    : success
      ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
      : danger
        ? "border-[var(--color-danger)] bg-transparent text-[var(--color-danger)]"
        : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)]";

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-[30px] w-[30px] min-w-[30px] shrink-0 items-center justify-center rounded-lg border p-0 text-xs shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClass,
      ].join(" ")}
      style={style}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-panel)] p-[3px]">
      {children}
    </div>
  );
}

function ToolbarDivider() {
  return <div aria-hidden="true" className="mx-[2px] h-[18px] w-px shrink-0 bg-[var(--color-border)]" />;
}

export function EditToolbar({
  tool,
  onToolChange,
  onStartLinearArray,
  onStartCircularArray,
  onCommitPolyline,
  onCancelDraft,
  onDeleteSelected,
  onResetView,
  onGenerate,
  isGenerating,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImportSvg,
  onGroupSelected,
  onUngroupSelected,
  onCloneSelected,
  onMirrorSelected,
  canGroupSelected,
  canUngroupSelected,
  hasSelection,
  hasDraft,
}: EditToolbarProps) {
  const svgInputRef = useRef<HTMLInputElement>(null);
  const tools = useToolPlugins();

  return (
    <div className="ui-panel-inset mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-[14px] p-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <ToolbarGroup>
          {tools.map((item) => (
            <ToolbarButton
              key={item.id}
              title={`${item.label} — ${item.hint}`}
              ariaLabel={item.label}
              active={tool === item.id}
              onClick={() => onToolChange(item.id)}
            >
              {item.icon}
            </ToolbarButton>
          ))}
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            title="Импортировать SVG"
            ariaLabel="Импортировать SVG"
            onClick={() => svgInputRef.current?.click()}
          >
            <FiImage size={14} />
          </ToolbarButton>

          <input
            ref={svgInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportSvg(file);
              e.target.value = "";
            }}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            title="Отменить"
            ariaLabel="Отменить"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <FiCornerUpLeft size={14} />
          </ToolbarButton>

          <ToolbarButton
            title="Повторить"
            ariaLabel="Повторить"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <FiCornerUpRight size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Сбросить вид"
            ariaLabel="Сбросить вид"
            onClick={onResetView}
          >
            <FiMaximize size={14} />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            title="Клонировать"
            ariaLabel="Клонировать"
            disabled={!hasSelection}
            onClick={onCloneSelected}
          >
            <FiCopy size={14} />
          </ToolbarButton>

          <ToolbarButton
            title="Сгруппировать"
            ariaLabel="Сгруппировать"
            disabled={!canGroupSelected}
            onClick={onGroupSelected}
          >
            <FiLayers size={14} />
          </ToolbarButton>

          <ToolbarButton
            title="Разгруппировать"
            ariaLabel="Разгруппировать"
            disabled={!canUngroupSelected}
            onClick={onUngroupSelected}
          >
            <FiX size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Линейный массив"
            ariaLabel="Линейный массив"
            disabled={!hasSelection}
            onClick={onStartLinearArray}
          >
            <FiCopy size={14} />
          </ToolbarButton>

          <ToolbarButton
            title="Круговой массив"
            ariaLabel="Круговой массив"
            disabled={!hasSelection}
            onClick={onStartCircularArray}
          >
            <FiRefreshCw size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Отразить по оси X"
            ariaLabel="Отразить по оси X"
            disabled={!hasSelection}
            onClick={() => onMirrorSelected("x")}
          >
            <FiRefreshCw size={14} style={{ transform: "scaleX(-1)" }} />
          </ToolbarButton>

          <ToolbarButton
            title="Отразить по оси Y"
            ariaLabel="Отразить по оси Y"
            disabled={!hasSelection}
            onClick={() => onMirrorSelected("y")}
          >
            <FiRefreshCw size={14} style={{ transform: "scaleY(-1)" }} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title="Удалить выбранные объекты"
            ariaLabel="Удалить"
            danger
            disabled={!hasSelection}
            onClick={onDeleteSelected}
          >
            <FiTrash2 size={14} />
          </ToolbarButton>
        </ToolbarGroup>

        {hasDraft && (
          <ToolbarGroup>
            <ToolbarButton
              title="Завершить построение"
              ariaLabel="Завершить построение"
              disabled={tool !== "polyline"}
              onClick={onCommitPolyline}
              success
            >
              <FiCheck size={14} />
            </ToolbarButton>

            <ToolbarButton
              title="Отменить текущий черновик"
              ariaLabel="Отменить черновик"
              danger
              onClick={onCancelDraft}
            >
              <FiX size={14} />
            </ToolbarButton>
          </ToolbarGroup>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        title={isGenerating ? "Генерация..." : "Сгенерировать"}
        aria-label={isGenerating ? "Генерация..." : "Сгенерировать"}
        className="ui-btn-primary grid h-8 w-8 min-w-8 shrink-0 place-items-center rounded-[10px] p-0 disabled:cursor-wait disabled:opacity-80"
      >
        <FiPlay size={14} />
      </button>
    </div>
  );
}
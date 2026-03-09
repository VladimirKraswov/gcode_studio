import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  FiCheck,
  FiCircle,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiGitCommit,
  FiImage,
  FiLayers,
  FiMaximize,
  FiMinus,
  FiMousePointer,
  FiPenTool,
  FiPlay,
  FiRefreshCw,
  FiSquare,
  FiTrash2,
  FiType,
  FiX,
} from "react-icons/fi";
import { useStyles } from "../../../styles/useStyles";
import { useTheme } from "../../../contexts/ThemeContext";
import type { MirrorAxis, SketchTool } from "../model/types";

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

type ToolItem = {
  id: SketchTool;
  label: string;
  hint: string;
  icon: ReactNode;
};

const tools: ToolItem[] = [
  {
    id: "select",
    label: "Выбор",
    hint: "Выделение и перемещение",
    icon: <FiMousePointer size={14} />,
  },
  {
    id: "rectangle",
    label: "Прямоугольник",
    hint: "Построить прямоугольник",
    icon: <FiSquare size={14} />,
  },
  {
    id: "circle",
    label: "Окружность",
    hint: "Построить окружность",
    icon: <FiCircle size={14} />,
  },
  {
    id: "line",
    label: "Линия",
    hint: "Построить линию",
    icon: <FiMinus size={14} />,
  },
  {
    id: "arc",
    label: "Дуга",
    hint: "Дуга: центр → старт → конец",
    icon: <FiGitCommit size={14} />,
  },
  {
    id: "polyline",
    label: "Ломаная",
    hint: "Построить ломаную",
    icon: <FiPenTool size={14} />,
  },
  {
    id: "text",
    label: "Текст",
    hint: "Добавить текст",
    icon: <FiType size={14} />,
  },
];

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
  const styles = useStyles();
  const { theme } = useTheme();

  const baseStyle: CSSProperties = {
    ...styles.buttonGhost,
    width: 30,
    height: 30,
    minWidth: 30,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    fontSize: 12,
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    border: active
      ? `1px solid ${theme.primary}`
      : success
        ? `1px solid ${theme.success}`
        : danger
          ? `1px solid ${theme.danger}`
          : `1px solid ${theme.border}`,
    background: active
      ? theme.primarySoft
      : success
        ? theme.successSoft
        : danger
          ? "transparent"
          : theme.panel,
    color: active
      ? theme.primaryText
      : success
        ? theme.success
        : danger
          ? theme.danger
          : theme.text,
    boxShadow: "none",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onClick}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </button>
  );
}

type ToolbarGroupProps = {
  children: ReactNode;
};

function ToolbarGroup({ children }: ToolbarGroupProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 3,
        borderRadius: 10,
        border: `1px solid ${theme.border}`,
        background: theme.panel,
      }}
    >
      {children}
    </div>
  );
}

function ToolbarDivider() {
  const { theme } = useTheme();

  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 18,
        background: theme.border,
        margin: "0 2px",
        flexShrink: 0,
      }}
    />
  );
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
  const styles = useStyles();
  const { theme } = useTheme();
  const svgInputRef = useRef<HTMLInputElement>(null);

  const primaryButtonStyle: CSSProperties = {
    ...styles.buttonPrimary,
    height: 32,
    width: 32,
    minWidth: 32,
    padding: 0,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    cursor: isGenerating ? "wait" : "pointer",
    opacity: isGenerating ? 0.8 : 1,
  };

  return (
    <div
      style={{
        ...styles.panelInset,
        padding: 6,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
        flexShrink: 0,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          minWidth: 0,
          flex: 1,
        }}
      >
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
            style={{ display: "none" }}
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
        style={primaryButtonStyle}
        title={isGenerating ? "Генерация..." : "Сгенерировать"}
        aria-label={isGenerating ? "Генерация..." : "Сгенерировать"}
      >
        <FiPlay size={14} />
      </button>
    </div>
  );
}
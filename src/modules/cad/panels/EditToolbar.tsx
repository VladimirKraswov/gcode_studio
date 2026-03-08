import { useRef } from "react";
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
import { ui } from "../../../styles/ui";
import type { MirrorAxis, SketchTool } from "../model/types";

type EditToolbarProps = {
  tool: SketchTool;
  onToolChange: (tool: SketchTool) => void;
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

const tools: Array<{ id: SketchTool; label: string; hint: string; icon: React.ReactNode }> = [
  {
    id: "select",
    label: "Выбор",
    hint: "Выделение и перетаскивание объектов",
    icon: <FiMousePointer size={16} />,
  },
  {
    id: "rectangle",
    label: "Прямоуг.",
    hint: "Нарисовать прямоугольник",
    icon: <FiSquare size={16} />,
  },
  {
    id: "circle",
    label: "Окружн.",
    hint: "Нарисовать окружность",
    icon: <FiCircle size={16} />,
  },
  {
    id: "line",
    label: "Линия",
    hint: "Нарисовать линию",
    icon: <FiMinus size={16} />,
  },
  {
    id: "arc",
    label: "Дуга",
    hint: "Дуга: центр → старт → конец",
    icon: <FiGitCommit size={16} />,
  },
  {
    id: "polyline",
    label: "Ломаная",
    hint: "Добавление точек полилинии",
    icon: <FiPenTool size={16} />,
  },
  {
    id: "text",
    label: "Текст",
    hint: "Вставка текстового объекта",
    icon: <FiType size={16} />,
  },
];

export function EditToolbar({
  tool,
  onToolChange,
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
  const svgInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      style={{
        ...ui.panelInset,
        padding: 10,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {tools.map((item) => {
          const active = tool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label} — ${item.hint}`}
              onClick={() => onToolChange(item.id)}
              style={active ? ui.buttonPrimary : ui.buttonGhost}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {(tool === "polyline" || hasDraft) && (
          <button
            type="button"
            title="Завершить текущий объект"
            onClick={onCommitPolyline}
            style={ui.buttonGhost}
            disabled={tool !== "polyline"}
          >
            <FiCheck size={16} />
            <span>Завершить</span>
          </button>
        )}

        {hasDraft && (
          <button
            type="button"
            title="Отменить текущее рисование"
            onClick={onCancelDraft}
            style={ui.buttonGhost}
          >
            <FiX size={16} />
            <span>Отменить</span>
          </button>
        )}

        <button
          type="button"
          title="Импортировать SVG"
          onClick={() => svgInputRef.current?.click()}
          style={ui.buttonGhost}
        >
          <FiImage size={16} />
          <span>SVG</span>
        </button>

        <input
          ref={svgInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportSvg(file);
            }
            event.currentTarget.value = "";
          }}
        />

        {canGroupSelected && (
          <button
            type="button"
            title="Сгруппировать выбранные объекты"
            onClick={onGroupSelected}
            style={ui.buttonGhost}
          >
            <FiLayers size={16} />
            <span>Группа</span>
          </button>
        )}

        {canUngroupSelected && (
          <button
            type="button"
            title="Разгруппировать выбранную группу"
            onClick={onUngroupSelected}
            style={ui.buttonGhost}
          >
            <FiX size={16} />
            <span>Разгруппа</span>
          </button>
        )}

        <button
          type="button"
          title="Клонировать выбранные объекты"
          onClick={onCloneSelected}
          disabled={!hasSelection}
          style={{
            ...ui.buttonGhost,
            opacity: hasSelection ? 1 : 0.45,
            cursor: hasSelection ? "pointer" : "not-allowed",
          }}
        >
          <FiCopy size={16} />
          <span>Клон</span>
        </button>

        <button
          type="button"
          title="Отзеркалить по оси X относительно центра выделения"
          onClick={() => onMirrorSelected("x")}
          disabled={!hasSelection}
          style={{
            ...ui.buttonGhost,
            opacity: hasSelection ? 1 : 0.45,
            cursor: hasSelection ? "pointer" : "not-allowed",
          }}
        >
          <FiRefreshCw size={16} />
          <span>Зеркало X</span>
        </button>

        <button
          type="button"
          title="Отзеркалить по оси Y относительно центра выделения"
          onClick={() => onMirrorSelected("y")}
          disabled={!hasSelection}
          style={{
            ...ui.buttonGhost,
            opacity: hasSelection ? 1 : 0.45,
            cursor: hasSelection ? "pointer" : "not-allowed",
          }}
        >
          <FiRefreshCw size={16} />
          <span>Зеркало Y</span>
        </button>

        <button
          type="button"
          title="Удалить выбранный объект"
          onClick={onDeleteSelected}
          style={ui.buttonDanger}
        >
          <FiTrash2 size={16} />
          <span>Удалить</span>
        </button>

        <button
          type="button"
          title="Сбросить масштаб и позицию холста"
          onClick={onResetView}
          style={ui.buttonGhost}
        >
          <FiMaximize size={16} />
          <span>Вид</span>
        </button>

        <button
          type="button"
          title="Отменить последнее действие"
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            ...ui.buttonGhost,
            opacity: canUndo ? 1 : 0.45,
            cursor: canUndo ? "pointer" : "not-allowed",
          }}
        >
          <FiCornerUpLeft size={16} />
          <span>Назад</span>
        </button>

        <button
          type="button"
          title="Повторить действие"
          onClick={onRedo}
          disabled={!canRedo}
          style={{
            ...ui.buttonGhost,
            opacity: canRedo ? 1 : 0.45,
            cursor: canRedo ? "pointer" : "not-allowed",
          }}
        >
          <FiCornerUpRight size={16} />
          <span>Вперёд</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        title="Сгенерировать G-code из текущего документа"
        style={{ ...ui.buttonPrimary, flexShrink: 0 }}
      >
        <FiPlay size={16} />
        {isGenerating ? "Генерация..." : "Сгенерировать G-code"}
      </button>
    </div>
  );
}
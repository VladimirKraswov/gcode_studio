import {
  FiCheck,
  FiCircle,
  FiMaximize,
  FiMousePointer,
  FiPenTool,
  FiPlay,
  FiSquare,
  FiTrash2,
  FiType,
} from "react-icons/fi";
import { ui } from "../../../styles/ui";
import type { SketchTool } from "../model/types";

type EditToolbarProps = {
  tool: SketchTool;
  onToolChange: (tool: SketchTool) => void;
  onCommitPolyline: () => void;
  onDeleteSelected: () => void;
  onResetView: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
};

const tools: Array<{ id: SketchTool; label: string; hint: string; icon: React.ReactNode }> = [
  { id: "select", label: "Select", hint: "Выделение и перетаскивание объектов", icon: <FiMousePointer size={16} /> },
  { id: "rectangle", label: "Rectangle", hint: "Нарисовать прямоугольник", icon: <FiSquare size={16} /> },
  { id: "circle", label: "Circle", hint: "Нарисовать окружность", icon: <FiCircle size={16} /> },
  { id: "polyline", label: "Polyline", hint: "Добавление точек полилинии", icon: <FiPenTool size={16} /> },
  { id: "text", label: "Text", hint: "Вставка текстового объекта", icon: <FiType size={16} /> },
];

export function EditToolbar({
  tool,
  onToolChange,
  onCommitPolyline,
  onDeleteSelected,
  onResetView,
  onGenerate,
  isGenerating,
}: EditToolbarProps) {
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tools.map((item) => {
          const active = tool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label} — ${item.hint}`}
              onClick={() => onToolChange(item.id)}
              style={{
                ...(active ? ui.buttonPrimary : ui.buttonGhost),
                width: 38,
                height: 38,
                padding: 0,
              }}
            >
              {item.icon}
            </button>
          );
        })}

        {tool === "polyline" && (
          <button
            type="button"
            title="Завершить текущую полилинию"
            onClick={onCommitPolyline}
            style={{ ...ui.buttonGhost, width: 38, height: 38, padding: 0 }}
          >
            <FiCheck size={16} />
          </button>
        )}

        <button
          type="button"
          title="Удалить выбранный объект"
          onClick={onDeleteSelected}
          style={{ ...ui.buttonDanger, width: 38, height: 38, padding: 0 }}
        >
          <FiTrash2 size={16} />
        </button>

        <button
          type="button"
          title="Сбросить масштаб и позицию холста"
          onClick={onResetView}
          style={{ ...ui.buttonGhost, width: 38, height: 38, padding: 0 }}
        >
          <FiMaximize size={16} />
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
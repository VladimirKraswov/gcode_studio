import { theme } from "../../../styles/ui";
import type { SketchTool } from "../model/types";

type EditStatusBarProps = {
  objectCount: number;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isTransforming: boolean;
};

export function EditStatusBar({
  objectCount,
  tool,
  isDragging,
  isPanning,
  isTransforming,
}: EditStatusBarProps) {
  const interactionLabel = isTransforming
    ? "Трансформация / ограничение"
    : isDragging
      ? "Перетаскивание объекта"
      : isPanning
        ? "Панорамирование"
        : tool === "select"
          ? "Выделение"
          : tool === "text"
            ? "Вставка текста"
            : tool === "polyline"
              ? "Рисование полилинии"
              : tool === "rectangle"
                ? "Рисование прямоугольника"
                : tool === "circle"
                  ? "Рисование окружности"
                  : tool === "line"
                    ? "Рисование линии"
                    : tool === "arc"
                      ? "Рисование дуги"
                      : "Редактирование";

  const hint =
    tool === "arc"
      ? "Дуга: 1-й клик — центр, 2-й — старт/радиус, 3-й — конец дуги."
      : tool === "polyline"
        ? "Полилиния: кликай по точкам, Enter или двойной клик — завершить, Escape — отменить."
        : "Потяни за маркер ребра, чтобы создать ограничение. Потяни за плашку размера, чтобы менять расстояние мышкой.";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 12,
        color: theme.textMuted,
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      <span>{hint}</span>
      <span>
        {interactionLabel} · Объектов: {objectCount}
      </span>
    </div>
  );
}
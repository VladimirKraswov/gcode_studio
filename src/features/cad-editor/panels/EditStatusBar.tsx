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

  const hint = hasDraft
    ? "ПКМ — отменить текущее рисование."
    : tool === "arc"
      ? "Дуга: 1-й клик — центр, 2-й — старт/радиус, 3-й — конец дуги."
      : tool === "polyline"
        ? "Полилиния: кликай по точкам, Enter или двойной клик — завершить, Escape — отменить."
        : tool === "select"
          ? "Выделение доступно только в режиме выбора. Во время рисования клик проходит сквозь существующие объекты."
          : "Потяни за маркер ребра, чтобы создать ограничение. Потяни за плашку размера, чтобы менять расстояние мышкой.";

  return (
    <div className="mt-3 flex shrink-0 flex-wrap justify-between gap-3 text-xs text-[var(--color-text-muted)]">
      <span>{hint}</span>
      <span>
        {interactionLabel} · Объектов: {objectCount}
      </span>
    </div>
  );
}
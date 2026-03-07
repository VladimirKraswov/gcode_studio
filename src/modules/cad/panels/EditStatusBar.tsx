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
    ? "Масштабирование / поворот"
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
                  : "Редактирование";

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
      <span>
        Углы рамки — масштаб. Круг сверху — поворот. Тонкие линии имеют расширенную область попадания.
      </span>
      <span>
        {interactionLabel} · Объектов: {objectCount}
      </span>
    </div>
  );
}
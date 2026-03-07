import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { SketchRectangle } from "../model/types";

type RectangleShapeViewProps = {
  shape: SketchRectangle;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGRectElement>) => void;
};

export function RectangleShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: RectangleShapeViewProps) {
  const p = cadToScreenPoint({ x: shape.x, y: shape.y + shape.height }, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  return (
    <>
      <rect
        x={p.x}
        y={p.y}
        width={shape.width * view.scale}
        height={shape.height * view.scale}
        fill="none"
        stroke={isSelected ? "#1d4ed8" : "#475569"}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        opacity={0.95}
        pointerEvents="none"
      />

      <rect
        x={p.x}
        y={p.y}
        width={shape.width * view.scale}
        height={shape.height * view.scale}
        fill="transparent"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        onPointerDown={onPointerDown}
      />
    </>
  );
}
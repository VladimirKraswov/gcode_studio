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

  return (
    <rect
      x={p.x}
      y={p.y}
      width={shape.width * view.scale}
      height={shape.height * view.scale}
      fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.05)"}
      stroke={isSelected ? "#2563eb" : "#475569"}
      strokeWidth={isSelected ? 2 : 1.5}
      onPointerDown={onPointerDown}
    />
  );
}
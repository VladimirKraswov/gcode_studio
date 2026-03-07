import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { SketchCircle } from "../model/types";

type CircleShapeViewProps = {
  shape: SketchCircle;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGCircleElement>) => void;
};

export function CircleShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: CircleShapeViewProps) {
  const p = cadToScreenPoint({ x: shape.cx, y: shape.cy }, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);

  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={shape.radius * view.scale}
      fill="none"
      stroke={isSelected ? "#2563eb" : "#475569"}
      strokeWidth={strokeWidth}
      onPointerDown={onPointerDown}
    />
  );
}
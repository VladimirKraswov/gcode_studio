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

export function CircleShapeView({ shape, documentHeight, view, isSelected, onPointerDown }: CircleShapeViewProps) {
  const p = cadToScreenPoint({ x: shape.cx, y: shape.cy }, documentHeight, view);

  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={shape.radius * view.scale}
      fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.05)"}
      stroke={isSelected ? "#2563eb" : "#475569"}
      strokeWidth={isSelected ? 2 : 1.5}
      onPointerDown={onPointerDown}
    />
  );
}

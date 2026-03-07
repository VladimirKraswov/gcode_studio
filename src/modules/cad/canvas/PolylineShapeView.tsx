import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { SketchPolyline } from "../model/types";

type PolylineShapeViewProps = {
  shape: SketchPolyline;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
};

export function PolylineShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: PolylineShapeViewProps) {
  const points = shape.points
    .map((point) => {
      const p = cadToScreenPoint(point, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);

  return (
    <polyline
      points={points}
      fill="none"
      stroke={isSelected ? "#2563eb" : "#475569"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      onPointerDown={onPointerDown}
    />
  );
}
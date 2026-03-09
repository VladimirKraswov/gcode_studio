import { cadToScreenPoint } from "../../../utils/coordinates";
import { useTheme } from "../../../contexts/ThemeContext";
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
  const { theme } = useTheme();

  const points = shape.points
    .map((point) => {
      const p = cadToScreenPoint(point, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  return (
    <>
      <polyline
        points={points}
        fill="none"
        stroke={isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      <polyline
        points={points}
        fill="none"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPointerDown={onPointerDown}
      />
    </>
  );
}
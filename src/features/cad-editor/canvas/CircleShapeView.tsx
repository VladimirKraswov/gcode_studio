import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { SketchCircle, SketchPoint } from "../model/types";

export type CircleShapeViewProps = {
  shape: SketchCircle;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGCircleElement>) => void;
};

export function CircleShapeView({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: CircleShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(points.map(p => [p.id, p]));
  const center = pointMap.get(shape.center) || { x: 0, y: 0 };

  const p = cadToScreenPoint(center, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  const strokeColor = shape.isConstruction
    ? (isSelected ? "#60a5fa" : "#3b82f6")
    : (isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke);

  return (
    <>
      <circle
        cx={p.x}
        cy={p.y}
        r={shape.radius * view.scale}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        strokeDasharray={shape.isConstruction ? "4 4" : undefined}
        pointerEvents="none"
      />

      <circle
        cx={p.x}
        cy={p.y}
        r={shape.radius * view.scale}
        fill="transparent"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        onPointerDown={onPointerDown}
      />
    </>
  );
}

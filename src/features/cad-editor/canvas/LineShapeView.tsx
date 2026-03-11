import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { SketchLine, SketchPoint } from "../model/types";

export type LineShapeViewProps = {
  shape: SketchLine;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGLineElement>) => void;
};

export function LineShapeView({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: LineShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(points.map(p => [p.id, p]));
  const p1_cad = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2_cad = pointMap.get(shape.p2) || { x: 0, y: 0 };

  const p1 = cadToScreenPoint(p1_cad, documentHeight, view);
  const p2 = cadToScreenPoint(p2_cad, documentHeight, view);

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  const strokeColor = shape.isConstruction
    ? (isSelected ? "#60a5fa" : "#3b82f6")
    : (isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke);

  return (
    <>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={strokeColor}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        strokeDasharray={shape.isConstruction ? "4 4" : undefined}
        strokeLinecap="round"
        pointerEvents="none"
      />

      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        strokeLinecap="round"
        onPointerDown={onPointerDown}
      />
    </>
  );
}

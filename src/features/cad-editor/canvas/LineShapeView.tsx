import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { SketchLine } from "../model/types";

type LineShapeViewProps = {
  shape: SketchLine;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGLineElement>) => void;
};

export function LineShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: LineShapeViewProps) {
  const { theme } = useTheme();

  const p1 = cadToScreenPoint({ x: shape.x1, y: shape.y1 }, documentHeight, view);
  const p2 = cadToScreenPoint({ x: shape.x2, y: shape.y2 }, documentHeight, view);

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  return (
    <>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
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
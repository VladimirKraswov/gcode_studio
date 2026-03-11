import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
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
  const { theme } = useTheme();

  const p = cadToScreenPoint({ x: shape.cx, y: shape.cy }, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  return (
    <>
      <circle
        cx={p.x}
        cy={p.y}
        r={shape.radius * view.scale}
        fill="none"
        stroke={isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
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
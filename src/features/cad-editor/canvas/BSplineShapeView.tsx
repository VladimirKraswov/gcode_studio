import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { SketchBSpline, SketchPoint } from "../model/types";

export type BSplineShapeViewProps = {
  shape: SketchBSpline;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
};

export function BSplineShapeView({
  shape,
  points: allPoints,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: BSplineShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(allPoints.map(p => [p.id, p]));

  // For now, we render the control points as a polyline (simplified spline visualization)
  const polyPoints = shape.controlPointIds
    .map((id) => {
      const p_cad = pointMap.get(id) || { x: 0, y: 0 };
      const p = cadToScreenPoint(p_cad, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  return (
    <>
      {/* Spline Curve (Simplified as polyline through control points) */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      <polyline
        points={polyPoints}
        fill="none"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPointerDown={onPointerDown}
      />

      {/* Control Polygon */}
      {isSelected && (
        <polyline
          points={polyPoints}
          fill="none"
          stroke={theme.cad.draftGuide}
          strokeWidth={1}
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}
    </>
  );
}

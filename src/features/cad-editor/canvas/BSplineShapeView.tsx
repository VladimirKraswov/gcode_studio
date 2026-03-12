import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import { sampleBSpline, getBSplineControlPoints } from "../geometry/bspline";
import type { ViewTransform } from "../model/view";
import type { SketchBSpline, SketchPoint } from "../model/types";
import type { SketchSolveState } from "../model/solver/diagnostics";

export type BSplineShapeViewProps = {
  shape: SketchBSpline;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
  overrideStroke?: string;
};

export function BSplineShapeView({
  shape,
  points: allPoints,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
  overrideStroke,
}: BSplineShapeViewProps) {
  const { theme } = useTheme();

  const splinePoints = sampleBSpline(shape, allPoints, 120);
  const controlPoints = getBSplineControlPoints(shape, allPoints);

  const curveSvgPoints = splinePoints
    .map((point) => {
      const p = cadToScreenPoint(point, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const controlSvgPoints = controlPoints
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
        points={curveSvgPoints}
        fill="none"
        stroke={overrideStroke || (isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke)}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      <polyline
        points={curveSvgPoints}
        fill="none"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPointerDown={onPointerDown}
      />

      {isSelected && controlPoints.length > 1 && (
        <polyline
          points={controlSvgPoints}
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

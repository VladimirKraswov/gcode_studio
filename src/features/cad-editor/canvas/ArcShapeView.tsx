import { cadToScreenPoint } from "@/utils/coordinates";
import { sampleArcPoints } from "@/features/cad-editor/geometry/geometryEngine";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { SketchArc, SketchPoint } from "../model/types";

export type ArcShapeViewProps = {
  shape: SketchArc;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
  overrideStroke?: string;
};

export function ArcShapeView({
  shape,
  points: allPoints,
  documentHeight,
  view,
  isSelected,
  solveState,
  onPointerDown,
  overrideStroke,
}: ArcShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(allPoints.map((p) => [p.id, p]));
  const center = pointMap.get(shape.center) || { x: 0, y: 0 };
  const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };

  const startAngle = (Math.atan2(p1.y - center.y, p1.x - center.x) * 180) / Math.PI;
  const endAngle = (Math.atan2(p2.y - center.y, p2.x - center.x) * 180) / Math.PI;

  const polyPoints = sampleArcPoints(
    center,
    shape.radius,
    startAngle,
    endAngle,
    shape.clockwise,
    72,
  )
    .map((point) => {
      const p = cadToScreenPoint(point, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  const strokeColor = overrideStroke || resolveShapeStrokeColor({
    solveState,
    isConstruction: shape.isConstruction,
    isSelected,
    fallbackStroke: theme.cad.shapeStroke,
    fallbackSelectedStroke: theme.cad.selectedStroke,
    fallbackConstructionStroke: "#3b82f6",
    fallbackConstructionSelectedStroke: "#60a5fa",
  });

  return (
    <>
      <polyline
        points={polyPoints}
        fill="none"
        stroke={strokeColor}
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
    </>
  );
}
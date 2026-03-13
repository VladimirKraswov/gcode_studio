import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { SketchPolyline, SketchPoint } from "../model/types";

export type PolylineShapeViewProps = {
  shape: SketchPolyline;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  selectionMode: "primitive" | "object";
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
  overrideStroke?: string;
};

export function PolylineShapeView({
  shape,
  points: allPoints,
  documentHeight,
  view,
  isSelected,
  selectionMode: _selectionMode,
  solveState,
  onPointerDown,
  overrideStroke,
}: PolylineShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(allPoints.map((p) => [p.id, p]));
  const polyPoints = shape.pointIds
    .map((id) => {
      const p_cad = pointMap.get(id) || { x: 0, y: 0 };
      const p = cadToScreenPoint(p_cad, documentHeight, view);
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
import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { SketchEllipse, SketchPoint } from "../model/types";

export type EllipseShapeViewProps = {
  shape: SketchEllipse;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGEllipseElement>) => void;
};

export function EllipseShapeView({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  solveState,
  onPointerDown,
}: EllipseShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(points.map((p) => [p.id, p]));
  const center_cad = pointMap.get(shape.center) || { x: 0, y: 0 };
  const major_cad = pointMap.get(shape.majorAxisPoint) || { x: center_cad.x + 10, y: center_cad.y };

  const dx = major_cad.x - center_cad.x;
  const dy = major_cad.y - center_cad.y;
  const majorRadius = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const p = cadToScreenPoint(center_cad, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  const strokeColor = resolveShapeStrokeColor({
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
      <ellipse
        cx={p.x}
        cy={p.y}
        rx={majorRadius * view.scale}
        ry={shape.minorAxisRadius * view.scale}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        transform={`rotate(${-angle} ${p.x} ${p.y})`}
        pointerEvents="none"
      />

      <ellipse
        cx={p.x}
        cy={p.y}
        rx={majorRadius * view.scale}
        ry={shape.minorAxisRadius * view.scale}
        fill="transparent"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        transform={`rotate(${-angle} ${p.x} ${p.y})`}
        onPointerDown={onPointerDown}
      />
    </>
  );
}
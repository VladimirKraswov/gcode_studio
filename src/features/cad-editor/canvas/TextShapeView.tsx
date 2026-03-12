import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { CadPoint } from "@/utils/fontGeometry";
import type { SketchText, SketchPoint } from "../model/types";

export type TextShapeViewProps = {
  shape: SketchText;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  solveState?: SketchSolveState;
  polylines: CadPoint[][];
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
};

export function TextShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  solveState,
  polylines: _polylines,
  onPointerDown,
}: TextShapeViewProps) {
  const { theme } = useTheme();

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  const scale = shape.scale ?? 1;

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
    <g onPointerDown={onPointerDown}>
      {_polylines.map((polyline, index) => {
        const points = polyline
          .map((point) => {
            const scaledPoint = {
              x: shape.x + (point.x - shape.x) * scale,
              y: shape.y + (point.y - shape.y) * scale,
            };
            const p = cadToScreenPoint(scaledPoint, documentHeight, view);
            return `${p.x},${p.y}`;
          })
          .join(" ");

        return (
          <g key={`${shape.id}-${index}`}>
            <polyline
              points={points}
              fill="none"
              stroke={strokeColor}
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
            />
          </g>
        );
      })}
    </g>
  );
}
import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { SketchSvg, SketchPoint } from "../model/types";

function rotatePoint(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

export type SvgShapeViewProps = {
  shape: SketchSvg;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
  overrideStroke?: string;
};

export function SvgShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  solveState,
  onPointerDown,
  overrideStroke,
}: Omit<SvgShapeViewProps, "points">) {
  const { theme } = useTheme();

  const scaleX = (shape.width / Math.max(shape.sourceWidth, 0.0001)) * (shape.scale ?? 1);
  const scaleY = (shape.height / Math.max(shape.sourceHeight, 0.0001)) * (shape.scale ?? 1);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);
  const rotation = shape.rotation ?? 0;
  const center = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };

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
    <g onPointerDown={onPointerDown}>
      {shape.contours.map((contour, index) => {
        const points = contour
          .map((pointStr) => {
            const [px, py] = pointStr.split(",").map(Number);
            const cadPoint = {
              x: shape.x + px * scaleX,
              y: shape.y + py * scaleY,
            };

            const rotated = rotation
              ? rotatePoint(cadPoint, center, rotation)
              : cadPoint;

            const screenP = cadToScreenPoint(rotated, documentHeight, view);
            return `${screenP.x},${screenP.y}`;
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
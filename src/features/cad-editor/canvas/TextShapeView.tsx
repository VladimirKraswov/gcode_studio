import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { CadPoint } from "@/utils/fontGeometry";
import type { SketchText, SketchPoint } from "../model/types";

export type TextShapeViewProps = {
  shape: SketchText;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  polylines: CadPoint[][];
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
};

export function TextShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  polylines,
  onPointerDown,
}: TextShapeViewProps) {
  const { theme } = useTheme();

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  return (
    <g onPointerDown={onPointerDown}>
      {polylines.map((polyline, index) => {
        const points = polyline
          .map((point) => {
            const p = cadToScreenPoint(point, documentHeight, view);
            return `${p.x},${p.y}`;
          })
          .join(" ");

        return (
          <g key={`${shape.id}-${index}`}>
            <polyline
              points={points}
              fill="none"
              stroke={isSelected ? theme.cad.selectedStroke : theme.cad.shapeStroke}
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

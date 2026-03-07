import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { CadPoint } from "../../../utils/fontGeometry";
import type { SketchText } from "../model/types";

type TextShapeViewProps = {
  shape: SketchText;
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
              stroke={isSelected ? "#1d4ed8" : "#475569"}
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
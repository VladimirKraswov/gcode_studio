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

  return (
    <g onPointerDown={onPointerDown}>
      {polylines.map((polyline, index) => (
        <polyline
          key={`${shape.id}-${index}`}
          points={polyline
            .map((point) => {
              const p = cadToScreenPoint(point, documentHeight, view);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke={isSelected ? "#2563eb" : "#475569"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}
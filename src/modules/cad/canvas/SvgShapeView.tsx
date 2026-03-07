import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { SketchSvg } from "../model/types";

type SvgShapeViewProps = {
  shape: SketchSvg;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
};

export function SvgShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: SvgShapeViewProps) {
  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  return (
    <g onPointerDown={onPointerDown}>
      {shape.contours.map((polyline, index) => {
        const points = polyline
          .map((point) => {
            const p = cadToScreenPoint(
              {
                x: shape.x + point.x * scaleX,
                y: shape.y + point.y * scaleY,
              },
              documentHeight,
              view,
            );
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
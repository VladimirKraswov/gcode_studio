// path: /src/modules/cad/canvas/SvgShapeView.tsx
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
          <polyline
            key={`${shape.id}-${index}`}
            points={points}
            fill="none"
            stroke={isSelected ? "#2563eb" : "#475569"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}
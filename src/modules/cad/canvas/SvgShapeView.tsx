import { cadToScreenPoint } from "../../../utils/coordinates";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ViewTransform } from "../model/view";
import type { SketchSvg } from "../model/types";

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
  const { theme } = useTheme();

  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);
  const rotation = shape.rotation ?? 0;
  const center = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };

  return (
    <g onPointerDown={onPointerDown}>
      {shape.contours.map((polyline, index) => {
        const points = polyline
          .map((point) => {
            const cadPoint = {
              x: shape.x + point.x * scaleX,
              y: shape.y + point.y * scaleY,
            };

            const rotated = rotation
              ? rotatePoint(cadPoint, center, rotation)
              : cadPoint;

            const p = cadToScreenPoint(rotated, documentHeight, view);
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
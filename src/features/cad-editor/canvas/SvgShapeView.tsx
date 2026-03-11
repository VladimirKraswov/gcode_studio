import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
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
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
};

export function SvgShapeView({
  shape,
  points: allPoints,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: SvgShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(allPoints.map(p => [p.id, p]));
  const anchor = pointMap.get(shape.anchorPoint) || { x: 0, y: 0 };

  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);
  const rotation = shape.rotation ?? 0;
  const center = {
    x: anchor.x + shape.width / 2,
    y: anchor.y + shape.height / 2,
  };

  return (
    <g onPointerDown={onPointerDown}>
      {shape.contours.map((contour, index) => {
        const points = contour
          .map((id) => {
            const point = pointMap.get(id) || { x: 0, y: 0 };
            const cadPoint = {
              x: anchor.x + point.x * scaleX,
              y: anchor.y + point.y * scaleY,
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

import { cadToScreenPoint } from "../../../utils/coordinates";
import { sampleArcPoints } from "../../geometry/geometryEngine";
import type { ViewTransform } from "../model/view";
import type { SketchArc } from "../model/types";

type ArcShapeViewProps = {
  shape: SketchArc;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<SVGPolylineElement>) => void;
};

export function ArcShapeView({
  shape,
  documentHeight,
  view,
  isSelected,
  onPointerDown,
}: ArcShapeViewProps) {
  const points = sampleArcPoints(
    { x: shape.cx, y: shape.cy },
    shape.radius,
    shape.startAngle,
    shape.endAngle,
    shape.clockwise,
    72,
  )
    .map((point) => {
      const p = cadToScreenPoint(point, documentHeight, view);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(16, strokeWidth + 14);

  return (
    <>
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
        onPointerDown={onPointerDown}
      />
    </>
  );
}
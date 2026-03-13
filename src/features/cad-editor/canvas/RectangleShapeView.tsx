import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { resolveShapeStrokeColor } from "./sketchStateColors";
import type { ViewTransform } from "../model/view";
import type { SketchRectangle, SketchPoint } from "../model/types";

export type RectangleShapeViewProps = {
  shape: SketchRectangle;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  selectionMode: "primitive" | "object";
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGRectElement>) => void;
  overrideStroke?: string;
};

export function RectangleShapeView({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  selectionMode: _selectionMode,
  solveState,
  onPointerDown,
  overrideStroke,
}: RectangleShapeViewProps) {
  const { theme } = useTheme();

  const pointMap = new Map(points.map((p) => [p.id, p]));
  const p1_cad = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2_cad = pointMap.get(shape.p2) || { x: 0, y: 0 };

  const minX = Math.min(p1_cad.x, p2_cad.x);
  const maxX = Math.max(p1_cad.x, p2_cad.x);
  const minY = Math.min(p1_cad.y, p2_cad.y);
  const maxY = Math.max(p1_cad.y, p2_cad.y);
  const width = maxX - minX;
  const height = maxY - minY;

  const p = cadToScreenPoint({ x: minX, y: maxY }, documentHeight, view);
  const strokeWidth = Math.max(1, (shape.strokeWidth ?? 1) * view.scale);
  const hitStrokeWidth = Math.max(14, strokeWidth + 12);

  const rectWidth = width * view.scale;
  const rectHeight = height * view.scale;
  const cx = p.x + rectWidth / 2;
  const cy = p.y + rectHeight / 2;
  const rotation = shape.rotation ?? 0;

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
    <>
      <rect
        x={p.x}
        y={p.y}
        width={rectWidth}
        height={rectHeight}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? Math.max(1.5, strokeWidth) : strokeWidth}
        opacity={0.95}
        pointerEvents="none"
        transform={rotation ? `rotate(${-rotation} ${cx} ${cy})` : undefined}
      />

      <rect
        x={p.x}
        y={p.y}
        width={rectWidth}
        height={rectHeight}
        fill="transparent"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        onPointerDown={onPointerDown}
        transform={rotation ? `rotate(${-rotation} ${cx} ${cy})` : undefined}
      />
    </>
  );
}
import type { CadPoint } from "@/utils/fontGeometry";
import type { ViewTransform } from "../model/view";
import type { SketchShape, SketchPoint } from "../model/types";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { useShapePlugin } from "../plugins/registry";

type ShapeRendererProps = {
  shape: SketchShape;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  textPreviewMap: Record<string, CadPoint[][]>;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
};

export function ShapeRenderer({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  textPreviewMap,
  solveState,
  onPointerDown,
}: ShapeRendererProps) {
  const plugin = useShapePlugin(shape);

  if (!plugin) {
    console.warn(`No shape plugin registered for type "${shape.type}"`);
    return null;
  }

  return (
    <>
      {plugin.render({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        textPreviewMap,
        solveState,
        onPointerDown,
      })}
    </>
  );
}
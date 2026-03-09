import type { CadPoint } from "../../../utils/fontGeometry";
import type { ViewTransform } from "../model/view";
import type { SketchShape } from "../model/types";
import { useShapePlugin } from "../plugins/registry";

type ShapeRendererProps = {
  shape: SketchShape;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  textPreviewMap: Record<string, CadPoint[][]>;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
};

export function ShapeRenderer({
  shape,
  documentHeight,
  view,
  isSelected,
  textPreviewMap,
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
        documentHeight,
        view,
        isSelected,
        textPreviewMap,
        onPointerDown,
      })}
    </>
  );
}
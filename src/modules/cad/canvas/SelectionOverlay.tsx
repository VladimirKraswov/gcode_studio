import { cadToScreenPoint } from "../../../utils/coordinates";
import { groupBounds, selectionBounds } from "../model/shapeBounds";
import type { SketchDocument } from "../model/types";
import type { SelectionState } from "../model/selection";
import type { ViewTransform } from "../model/view";

type SelectionOverlayProps = {
  document: SketchDocument;
  selection: SelectionState;
  documentHeight: number;
  view: ViewTransform;
  onPointerDown?: (event: React.PointerEvent<SVGRectElement>) => void;
};

export function SelectionOverlay({
  document,
  selection,
  documentHeight,
  view,
  onPointerDown,
}: SelectionOverlayProps) {
  if (selection.ids.length === 0) return null;

  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  const bounds = primary?.groupId
    ? groupBounds(document, primary.groupId)
    : selectionBounds(document.shapes.filter((shape) => selection.ids.includes(shape.id)));

  const topLeft = cadToScreenPoint(
    { x: bounds.minX, y: bounds.maxY },
    documentHeight,
    view,
  );

  const x = topLeft.x - 6;
  const y = topLeft.y - 6;
  const width = (bounds.maxX - bounds.minX) * view.scale + 12;
  const height = (bounds.maxY - bounds.minY) * view.scale + 12;

  return (
    <g>
      {onPointerDown && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="transparent"
          strokeWidth={12}
          rx={10}
          style={{ cursor: "move" }}
          onPointerDown={onPointerDown}
        />
      )}

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(37,99,235,0.08)"
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeDasharray="8 4"
        rx={10}
        pointerEvents="none"
      />
    </g>
  );
}
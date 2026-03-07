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
  isDragging?: boolean;
  isHover?: boolean;
  onHoverChange?: (value: boolean) => void;
};

export function SelectionOverlay({
  document,
  selection,
  documentHeight,
  view,
  onPointerDown,
  isDragging = false,
  isHover = false,
  onHoverChange,
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

  const palette = isDragging
    ? {
        stroke: "#d97706",
        fill: "rgba(245, 158, 11, 0.12)",
        dash: "10 6",
        width: 2,
        handleCursor: "grabbing" as const,
      }
    : isHover
      ? {
          stroke: "#1d4ed8",
          fill: "rgba(37, 99, 235, 0.12)",
          dash: "8 4",
          width: 1.75,
          handleCursor: "grab" as const,
        }
      : {
          stroke: "#2563eb",
          fill: "rgba(37, 99, 235, 0.06)",
          dash: "6 4",
          width: 1.5,
          handleCursor: "grab" as const,
        };

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
          strokeWidth={18}
          rx={10}
          style={{ cursor: palette.handleCursor }}
          onPointerDown={onPointerDown}
          onPointerEnter={() => onHoverChange?.(true)}
          onPointerLeave={() => onHoverChange?.(false)}
        />
      )}

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={palette.width}
        strokeDasharray={palette.dash}
        rx={10}
        pointerEvents="none"
      />

      {!isDragging && (
        <>
          <circle
            cx={x}
            cy={y}
            r={4}
            fill="#ffffff"
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />
          <circle
            cx={x + width}
            cy={y}
            r={4}
            fill="#ffffff"
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />
          <circle
            cx={x}
            cy={y + height}
            r={4}
            fill="#ffffff"
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />
          <circle
            cx={x + width}
            cy={y + height}
            r={4}
            fill="#ffffff"
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />
        </>
      )}
    </g>
  );
}
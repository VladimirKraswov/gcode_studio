import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import { groupBounds, selectionBounds } from "../model/shapeBounds";
import type { SketchDocument } from "../model/types";
import type { SelectionState } from "../model/selection";
import type { ViewTransform } from "../model/view";

type ScaleHandle = "nw" | "ne" | "sw" | "se";

type SelectionOverlayProps = {
  document: SketchDocument;
  selection: SelectionState;
  documentHeight: number;
  view: ViewTransform;
  onPointerDown?: (event: React.PointerEvent<SVGRectElement>) => void;
  onScaleHandlePointerDown?: (
    event: React.PointerEvent<SVGCircleElement>,
    handle: ScaleHandle,
  ) => void;
  onRotateHandlePointerDown?: (event: React.PointerEvent<SVGCircleElement>) => void;
  isDragging?: boolean;
  isHover?: boolean;
  onHoverChange?: (value: boolean) => void;
};

export function SelectionOverlay({
  document,
  selection,
  documentHeight,
  view,
  onScaleHandlePointerDown,
  onRotateHandlePointerDown,
  isDragging = false,
  isHover = false,
}: SelectionOverlayProps) {
  const { theme } = useTheme();

  if (selection.ids.length === 0) return null;

  const isParametricOnly = selection.ids.every(id => {
    if (id.startsWith("pt-")) return true;
    const s = document.shapes.find(shape => shape.id === id);
    return s && s.type !== "text" && s.type !== "svg";
  });

  // If only parametric shapes are selected, we hide the bounding box
  // to avoid cluttering and allow direct interaction with vertices/edges
  if (isParametricOnly) return null;

  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  const bounds = primary?.groupId
    ? groupBounds(document, primary.groupId)
    : selectionBounds(document.shapes.filter((shape) => selection.ids.includes(shape.id)), document.points);

  const topLeft = cadToScreenPoint(
    { x: bounds.minX, y: bounds.maxY },
    documentHeight,
    view,
  );

  const x = topLeft.x - 6;
  const y = topLeft.y - 6;
  const width = (bounds.maxX - bounds.minX) * view.scale + 12;
  const height = (bounds.maxY - bounds.minY) * view.scale + 12;

  const cx = x + width / 2;
  const rotateLineTop = y - 24;
  const rotateHandleY = y - 34;

  const palette = isDragging
    ? {
        stroke: theme.cad.selectionDragStroke,
        fill: theme.cad.selectionDragFill,
        dash: "10 6",
        width: 2,
        handleCursor: "grabbing" as const,
      }
    : isHover
      ? {
          stroke: theme.cad.selectionStroke,
          fill: theme.cad.selectionHoverFill,
          dash: "8 4",
          width: 1.75,
          handleCursor: "grab" as const,
        }
      : {
          stroke: theme.cad.selectionStroke,
          fill: theme.cad.selectionFill,
          dash: "6 4",
          width: 1.5,
          handleCursor: "grab" as const,
        };

  const corners: Array<{
    key: ScaleHandle;
    cx: number;
    cy: number;
    cursor: string;
  }> = [
    { key: "nw", cx: x, cy: y, cursor: "nwse-resize" },
    { key: "ne", cx: x + width, cy: y, cursor: "nesw-resize" },
    { key: "sw", cx: x, cy: y + height, cursor: "nesw-resize" },
    { key: "se", cx: x + width, cy: y + height, cursor: "nwse-resize" },
  ];

  return (
    <g pointerEvents="none">
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
      />

      {!isParametricOnly && (
        <>
          <line
            x1={cx}
            y1={y}
            x2={cx}
            y2={rotateLineTop}
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />

          <circle
            cx={cx}
            cy={rotateHandleY}
            r={11}
            fill="transparent"
            stroke="transparent"
            onPointerDown={onRotateHandlePointerDown}
            style={{ cursor: "alias", pointerEvents: "all" }}
          />

          <circle
            cx={cx}
            cy={rotateHandleY}
            r={5.5}
            fill={theme.cad.constraintLabelFill}
            stroke={palette.stroke}
            strokeWidth={1.5}
            pointerEvents="none"
          />
        </>
      )}

      {!isDragging && (!isParametricOnly) &&
        corners.map((corner) => (
          <g key={corner.key}>
            <circle
              cx={corner.cx}
              cy={corner.cy}
              r={12}
              fill="transparent"
              stroke="transparent"
              onPointerDown={(event) => onScaleHandlePointerDown?.(event, corner.key)}
              style={{ cursor: corner.cursor, pointerEvents: "all" }}
            />
            <circle
              cx={corner.cx}
              cy={corner.cy}
              r={4}
              fill={theme.cad.constraintLabelFill}
              stroke={palette.stroke}
              strokeWidth={1.5}
              pointerEvents="none"
            />
          </g>
        ))}
    </g>
  );
}

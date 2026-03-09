import { cadToScreenPoint } from "../../../utils/coordinates";
import { useTheme } from "../../../contexts/ThemeContext";
import { CadGrid } from "./CadGrid";
import { CadOriginMarker } from "./CadOriginMarker";
import { CadSheet } from "./CadSheet";
import { DraftOverlay } from "./DraftOverlay";
import { ShapeRenderer } from "./ShapeRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import { CadConstraintOverlay } from "./CadConstraintOverlay";
import type { DraftShape } from "../geometry/draftGeometry";
import type {
  ConstraintEdge,
  SketchDocument,
  SketchPolylinePoint,
  SketchShape,
  SketchTool,
} from "../model/types";
import type { ViewTransform } from "../model/view";
import type { SelectionState } from "../model/selection";
import { collectVisibleShapes } from "../model/grouping";
import { shapeBounds } from "../model/shapeBounds";
import type { CadPoint } from "../geometry/textGeometry";

type ScaleHandle = "nw" | "ne" | "sw" | "se";

type ConstraintDraftTarget =
  | {
      kind: "sheet";
      edge: ConstraintEdge;
    }
  | {
      kind: "shape";
      shapeId: string;
      edge: ConstraintEdge;
    };

type ConstraintDraftState = {
  shapeId: string;
  edge: ConstraintEdge;
  pointer: { x: number; y: number };
  hoverTarget: ConstraintDraftTarget | null;
} | null;

type CadCanvasProps = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  document: SketchDocument;
  selection: SelectionState;
  view: ViewTransform;
  draft: DraftShape;
  polylineDraft: SketchPolylinePoint[];
  polylineHoverPoint: SketchPolylinePoint | null;
  textPreviewMap: Record<string, CadPoint[][]>;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isSelectionHover: boolean;
  isTransforming: boolean;
  constraintDraft: ConstraintDraftState;
  arrayPreviewShapes: SketchShape[];
  onSelectionHoverChange: (value: boolean) => void;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerLeave: (event: React.PointerEvent<SVGSVGElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  onWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onContextMenu?: (event: React.MouseEvent<SVGSVGElement>) => void;
  onShapePointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
  onSelectionPointerDown?: (event: React.PointerEvent<SVGRectElement>) => void;
  onScaleHandlePointerDown?: (
    event: React.PointerEvent<SVGCircleElement>,
    handle: ScaleHandle,
  ) => void;
  onRotateHandlePointerDown?: (event: React.PointerEvent<SVGCircleElement>) => void;
  onConstraintEdgeHandlePointerDown?: (
    event: React.PointerEvent<SVGCircleElement>,
    edge: ConstraintEdge,
  ) => void;
  onConstraintLabelPointerDown?: (
    event: React.PointerEvent<SVGRectElement>,
    constraintId: string,
  ) => void;
};

function ArrayPreviewOverlay({
  shapes,
  documentHeight,
  view,
}: {
  shapes: SketchShape[];
  documentHeight: number;
  view: ViewTransform;
}) {
  const { theme } = useTheme();

  if (shapes.length === 0) return null;

  return (
    <g pointerEvents="none">
      {shapes.map((shape) => {
        const bounds = shapeBounds(shape);
        const topLeft = cadToScreenPoint(
          { x: bounds.minX, y: bounds.maxY },
          documentHeight,
          view,
        );

        const width = Math.max(1, (bounds.maxX - bounds.minX) * view.scale);
        const height = Math.max(1, (bounds.maxY - bounds.minY) * view.scale);

        return (
          <g key={`array-preview-${shape.id}`}>
            <rect
              x={topLeft.x}
              y={topLeft.y}
              width={width}
              height={height}
              rx={8}
              fill={theme.cad.arrayPreviewFill}
              stroke={theme.cad.arrayPreviewStroke}
              strokeWidth={1.5}
              strokeDasharray="8 4"
            />

            <line
              x1={topLeft.x}
              y1={topLeft.y}
              x2={topLeft.x + width}
              y2={topLeft.y + height}
              stroke={theme.cad.arrayPreviewGuide}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <line
              x1={topLeft.x + width}
              y1={topLeft.y}
              x2={topLeft.x}
              y2={topLeft.y + height}
              stroke={theme.cad.arrayPreviewGuide}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          </g>
        );
      })}
    </g>
  );
}

export function CadCanvas({
  svgRef,
  document,
  selection,
  view,
  draft,
  polylineDraft,
  polylineHoverPoint,
  textPreviewMap,
  tool,
  isDragging,
  isPanning,
  isSelectionHover,
  isTransforming,
  constraintDraft,
  arrayPreviewShapes,
  onSelectionHoverChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDoubleClick,
  onWheel,
  onContextMenu,
  onShapePointerDown,
  onSelectionPointerDown,
  onScaleHandlePointerDown,
  onRotateHandlePointerDown,
  onConstraintEdgeHandlePointerDown,
  onConstraintLabelPointerDown,
}: CadCanvasProps) {
  const { theme } = useTheme();

  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;
  const showSelection = tool === "select";

  const selectedIds = new Set(
    showSelection
      ? primary?.groupId
        ? document.shapes
            .filter((shape) => shape.groupId === primary.groupId)
            .map((shape) => shape.id)
        : selection.ids
      : [],
  );

  function resolveCanvasCursor() {
    if (isPanning) return "grabbing";
    if (tool === "text") return "text";
    if (tool !== "select") return "crosshair";
    if (isDragging || isTransforming) return "grabbing";
    if (isSelectionHover) return "grab";
    if (constraintDraft) return "crosshair";
    return "default";
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
        userSelect: "none",
        cursor: resolveCanvasCursor(),
        background: theme.cad.canvasBg,
      }}
    >
      <CadGrid document={document} view={view} />
      <CadSheet document={document} view={view} />
      <CadOriginMarker documentHeight={document.height} view={view} />

      {collectVisibleShapes(document).map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          documentHeight={document.height}
          view={view}
          isSelected={selectedIds.has(shape.id)}
          textPreviewMap={textPreviewMap}
          onPointerDown={onShapePointerDown}
        />
      ))}

      <ArrayPreviewOverlay
        shapes={arrayPreviewShapes}
        documentHeight={document.height}
        view={view}
      />

      {showSelection && (
        <SelectionOverlay
          document={document}
          selection={selection}
          documentHeight={document.height}
          view={view}
          onPointerDown={onSelectionPointerDown}
          onScaleHandlePointerDown={onScaleHandlePointerDown}
          onRotateHandlePointerDown={onRotateHandlePointerDown}
          isDragging={isDragging || isTransforming}
          isHover={isSelectionHover}
          onHoverChange={onSelectionHoverChange}
        />
      )}

      {tool === "select" &&
        selection.primaryId &&
        onConstraintEdgeHandlePointerDown &&
        onConstraintLabelPointerDown && (
          <CadConstraintOverlay
            document={document}
            selection={selection}
            documentHeight={document.height}
            view={view}
            constraintDraft={constraintDraft}
            onEdgeHandlePointerDown={onConstraintEdgeHandlePointerDown}
            onConstraintLabelPointerDown={onConstraintLabelPointerDown}
          />
        )}

      <DraftOverlay
        draft={draft}
        polylineDraft={polylineDraft}
        polylineHoverPoint={polylineHoverPoint}
        documentHeight={document.height}
        view={view}
      />
    </svg>
  );
}
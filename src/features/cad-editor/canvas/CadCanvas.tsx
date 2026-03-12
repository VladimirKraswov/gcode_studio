import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import { CadGrid } from "./CadGrid";
import { CadOriginMarker } from "./CadOriginMarker";
import { CadSheet } from "./CadSheet";
import { DraftOverlay } from "./DraftOverlay";
import { ShapeRenderer } from "./ShapeRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import { CadConstraintOverlay } from "./CadConstraintOverlay";
import type { DraftShape } from "../geometry/draftGeometry";
import type {
  SketchDocument,
  SketchShape,
  SketchTool,
} from "../model/types";
import type { ViewTransform } from "../model/view";
import { type SelectionState } from "../model/selection";
import { collectVisibleShapes } from "../model/grouping";
import { shapeBounds } from "../model/shapeBounds";
import type { CadPoint } from "../geometry/textGeometry";
import type { SketchSolveState } from "../model/solver/diagnostics";

type ScaleHandle = "nw" | "ne" | "sw" | "se";

type CadCanvasProps = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  document: SketchDocument;
  selection: SelectionState;
  view: ViewTransform;
  draft: DraftShape;
  polylineDraft: any[];
  polylineHoverPoint: any | null;
  textPreviewMap: Record<string, CadPoint[][]>;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isSelectionHover: boolean;
  isTransforming: boolean;
  arrayPreviewShapes: SketchShape[];
  solveState?: SketchSolveState;
  conflictingConstraintIds?: string[];
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
  onConstraintPointerDown?: (event: React.PointerEvent<SVGElement>, constraintId: string) => void;
  onConstraintValueChange?: (constraintId: string, value: number) => void;
  onConstraintDelete?: (constraintId: string) => void;
};

function ArrayPreviewOverlay({
  shapes,
  document,
  view,
}: {
  shapes: SketchShape[];
  document: SketchDocument;
  view: ViewTransform;
}) {
  const { theme } = useTheme();

  if (shapes.length === 0) return null;

  return (
    <g pointerEvents="none">
      {shapes.map((shape) => {
        const bounds = shapeBounds(shape, document.points);
        const topLeft = cadToScreenPoint(
          { x: bounds.minX, y: bounds.maxY },
          document.height,
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
              rx={4}
              fill={theme.cad.arrayPreviewFill}
              stroke={theme.cad.arrayPreviewStroke}
              strokeWidth={1.5}
              strokeDasharray="8 4"
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
  arrayPreviewShapes,
  solveState,
  conflictingConstraintIds = [],
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
  onConstraintPointerDown,
  onConstraintValueChange,
  onConstraintDelete,
}: CadCanvasProps) {
  const { theme } = useTheme();

  const showSelection = tool === "select";
  const selectedIds = new Set(showSelection ? selection.ids : []);

  function resolveCanvasCursor() {
    if (isPanning) return "grabbing";
    if (tool === "text") return "text";
    if (tool !== "select") return "crosshair";
    if (isDragging || isTransforming) return "grabbing";
    if (isSelectionHover) return "grab";
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
          points={document.points}
          documentHeight={document.height}
          view={view}
          isSelected={selectedIds.has(shape.id)}
          textPreviewMap={textPreviewMap}
          solveState={solveState}
          onPointerDown={onShapePointerDown}
        />
      ))}

      <ArrayPreviewOverlay
        shapes={arrayPreviewShapes}
        document={document}
        view={view}
      />

      {tool === "select" && (
        <CadConstraintOverlay
          document={document}
          documentHeight={document.height}
          view={view}
          selection={selection}
          solveState={solveState}
          conflictingConstraintIds={conflictingConstraintIds}
          onPointerDown={onConstraintPointerDown}
          onDimensionValueChange={onConstraintValueChange}
          onDimensionDelete={onConstraintDelete}
        />
      )}

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

import { useTheme } from "@/shared/hooks/useTheme";
import { CadGrid } from "./CadGrid";
import { CadOriginMarker } from "./CadOriginMarker";
import { CadSheet } from "./CadSheet";
import { SelectionBoxOverlay } from "./SelectionBoxOverlay";
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
import type { CadPoint } from "../geometry/textGeometry";
import type { SketchSolveState } from "../model/solver/diagnostics";

type ScaleHandle = "nw" | "ne" | "sw" | "se";

type CadCanvasProps = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  document: SketchDocument;
  selection: SelectionState;
  selectionMode: "primitive" | "object";
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
  arrayPreview: { shapes: SketchShape[]; points: any[] } | null;
  selectionBox: { startX: number; startY: number; endX: number; endY: number; moved: boolean } | null;
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
  preview,
  document,
  view,
  selectionMode,
  textPreviewMap,
}: {
  preview: { shapes: SketchShape[]; points: any[] } | null;
  document: SketchDocument;
  view: ViewTransform;
  selectionMode: "primitive" | "object";
  textPreviewMap: any;
}) {
  if (!preview || preview.shapes.length === 0) return null;

  return (
    <g pointerEvents="none" stroke="#f97316" strokeDasharray="4 2" opacity="0.8">
      {preview.shapes.map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={{ ...shape }}
          points={preview.points}
          documentHeight={document.height}
          view={view}
          isSelected={false}
          selectionMode={selectionMode}
          textPreviewMap={textPreviewMap}
          onPointerDown={() => {}}
          overrideStroke="#f97316"
        />
      ))}
    </g>
  );
}

export function CadCanvas({
  svgRef,
  document,
  selection,
  selectionMode,
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
  arrayPreview,
  selectionBox,
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
      <defs>
        <pattern
          id="pocket-hatch"
          patternUnits="userSpaceOnUse"
          width={10}
          height={10}
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="10"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
        </pattern>
      </defs>
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
          selectionMode={selectionMode}
          textPreviewMap={textPreviewMap}
          solveState={solveState}
          onPointerDown={onShapePointerDown}
        />
      ))}

      <ArrayPreviewOverlay
        preview={arrayPreview}
        document={document}
        view={view}
        selectionMode={selectionMode}
        textPreviewMap={textPreviewMap}
      />

      {selectionMode === "primitive" && tool === "select" && (
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
          selectionMode={selectionMode}
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

      <SelectionBoxOverlay
        box={selectionBox}
        documentHeight={document.height}
        view={view}
      />

      {selectionMode === "primitive" && (
        <DraftOverlay
          draft={draft}
          polylineDraft={polylineDraft}
          polylineHoverPoint={polylineHoverPoint}
          documentHeight={document.height}
          view={view}
        />
      )}
    </svg>
  );
}

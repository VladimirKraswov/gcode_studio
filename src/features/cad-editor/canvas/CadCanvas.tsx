import { useState } from "react";
import { cadToScreenPoint, screenToCadPoint } from "@/utils/coordinates";
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
  arrayPreview: { shapes: SketchShape[]; points: any[] } | null;
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
  onSplitLine?: (lineId: string, x: number, y: number) => void;
  onMergePoints?: (p1Id: string, p2Id: string) => void;
};

function ArrayPreviewOverlay({
  preview,
  document,
  view,
  textPreviewMap,
}: {
  preview: { shapes: SketchShape[]; points: any[] } | null;
  document: SketchDocument;
  view: ViewTransform;
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
  onSplitLine,
  onMergePoints,
}: CadCanvasProps) {
  const { theme } = useTheme();
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

  const showSelection = tool === "select";
  const selectedIds = new Set(showSelection ? selection.ids : []);

  function resolveCanvasCursor() {
    if (isPanning) return "grabbing";
    if (tool === "text") return "text";
    if (tool === "trim") return "no-drop";
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
      onPointerDown={(e) => {
          if (tool === "select" && e.button === 0) {
              const hitPoint = document.points.find(p => {
                  const screen = cadToScreenPoint(p, document.height, view);
                  const d = Math.sqrt((screen.x - e.clientX)**2 + (screen.y - e.clientY)**2);
                  return d < 12;
              });
              if (hitPoint) setDraggedPointId(hitPoint.id);
          }
          onPointerDown(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => {
          if (tool === "select" && draggedPointId) {
              const targetPoint = document.points.find(p => {
                  if (p.id === draggedPointId) return false;
                  const screen = cadToScreenPoint(p, document.height, view);
                  const d = Math.sqrt((screen.x - e.clientX)**2 + (screen.y - e.clientY)**2);
                  return d < 12;
              });
              if (targetPoint) {
                  onMergePoints?.(targetPoint.id, draggedPointId);
              }
          }
          setDraggedPointId(null);
          onPointerUp(e);
      }}
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
          onPointerDown={(e, id) => {
              if (e.detail === 2 && shape.type === "line" && svgRef.current) {
                  const rawCad = screenToCadPoint(
                      e.clientX,
                      e.clientY,
                      svgRef.current.getBoundingClientRect(),
                      document.height,
                      view
                  );
                  if (rawCad) onSplitLine?.(id, rawCad.x, rawCad.y);
              } else {
                  onShapePointerDown(e, id);
              }
          }}
        />
      ))}

      <ArrayPreviewOverlay
        preview={arrayPreview}
        document={document}
        view={view}
        textPreviewMap={textPreviewMap}
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

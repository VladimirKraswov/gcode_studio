import { CadGrid } from "./CadGrid";
import { CadOriginMarker } from "./CadOriginMarker";
import { CadSheet } from "./CadSheet";
import { DraftOverlay } from "./DraftOverlay";
import { ShapeRenderer } from "./ShapeRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import type { DraftShape } from "../geometry/draftGeometry";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchTool,
} from "../model/types";
import type { ViewTransform } from "../model/view";
import type { SelectionState } from "../model/selection";
import { collectVisibleShapes } from "../model/grouping";
import type { CadPoint } from "../geometry/textGeometry";

type CadCanvasProps = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  document: SketchDocument;
  selection: SelectionState;
  view: ViewTransform;
  draft: DraftShape;
  polylineDraft: SketchPolylinePoint[];
  textPreviewMap: Record<string, CadPoint[][]>;
  tool: SketchTool;
  isDragging: boolean;
  isPanning: boolean;
  isSelectionHover: boolean;
  onSelectionHoverChange: (value: boolean) => void;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onShapePointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
  onSelectionPointerDown?: (event: React.PointerEvent<SVGRectElement>) => void;
};

export function CadCanvas({
  svgRef,
  document,
  selection,
  view,
  draft,
  polylineDraft,
  textPreviewMap,
  tool,
  isDragging,
  isPanning,
  isSelectionHover,
  onSelectionHoverChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onWheel,
  onShapePointerDown,
  onSelectionPointerDown,
}: CadCanvasProps) {
  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  const selectedIds = new Set(
    primary?.groupId
      ? document.shapes
          .filter((shape) => shape.groupId === primary.groupId)
          .map((shape) => shape.id)
      : selection.ids,
  );

  function resolveCanvasCursor() {
    if (isPanning) return "grabbing";
    if (tool === "text") return "text";
    if (tool !== "select") return "crosshair";
    if (isDragging) return "grabbing";
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
      onWheel={onWheel}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
        userSelect: "none",
        cursor: resolveCanvasCursor(),
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

      <SelectionOverlay
        document={document}
        selection={selection}
        documentHeight={document.height}
        view={view}
        onPointerDown={onSelectionPointerDown}
        isDragging={isDragging}
        isHover={isSelectionHover}
        onHoverChange={onSelectionHoverChange}
      />

      <DraftOverlay
        draft={draft}
        polylineDraft={polylineDraft}
        documentHeight={document.height}
        view={view}
      />
    </svg>
  );
}
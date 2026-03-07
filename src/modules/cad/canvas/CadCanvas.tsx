import { CadGrid } from "./CadGrid";
import { CadOriginMarker } from "./CadOriginMarker";
import { CadSheet } from "./CadSheet";
import { DraftOverlay } from "./DraftOverlay";
import { ShapeRenderer } from "./ShapeRenderer";
import type { DraftShape } from "../geometry/draftGeometry";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchTool,
} from "../model/types";
import type { ViewTransform } from "../model/view";
import type { SelectionState } from "../model/selection";
import { isSelected } from "../model/selection";
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
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: React.WheelEvent<SVGSVGElement>) => void;
  onShapePointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
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
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onWheel,
  onShapePointerDown,
}: CadCanvasProps) {
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
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
        userSelect: "none",
        cursor:
          tool === "text"
            ? "text"
            : tool === "select"
              ? "default"
              : "crosshair",
      }}
    >
      <CadGrid document={document} view={view} />
      <CadSheet document={document} view={view} />
      <CadOriginMarker documentHeight={document.height} view={view} />

      {document.shapes.map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          documentHeight={document.height}
          view={view}
          isSelected={isSelected(selection, shape.id)}
          textPreviewMap={textPreviewMap}
          onPointerDown={onShapePointerDown}
        />
      ))}

      <DraftOverlay
        draft={draft}
        polylineDraft={polylineDraft}
        documentHeight={document.height}
        view={view}
      />
    </svg>
  );
}
import { useRef, useState } from "react";
import {
  appendPolylinePoint,
  finishDrag,
  startCircleDraft,
  startDrag,
  startRectangleDraft,
  updateDraft,
  updateDrag,
} from "../editor-state/commands";
import type { DragState } from "../editor-state/draftState";
import { createDefaultView } from "../editor-state/editorState";
import {
  DEFAULT_FONT_OPTIONS,
  createDefaultTextToolState,
} from "../editor-state/textToolState";
import type { DraftShape } from "../geometry/draftGeometry";
import {
  getCircleFromDraft,
  getRectangleFromDraft,
} from "../geometry/draftGeometry";
import { addShape } from "../model/document";
import {
  createCircleShape,
  createPolylineShape,
  createRectangleShape,
  createSvgShape,
  createTextShape,
} from "../model/shapeFactory";
import { moveShape } from "../model/shapeTransforms";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchTool,
} from "../model/types";
import type { SelectionState } from "../model/selection";
import {
  clearSelection,
  isSelected,
  selectOnly,
  toggleSelection,
} from "../model/selection";
import {
  getDragShapeIds,
  groupSelectedShapes,
  normalizeSelectionAfterDelete,
  ungroupSelectedShapes,
} from "../model/grouping";
import { generateSketchGCode } from "../../cam/gcode/generator";
import { screenToCadPoint } from "../../../utils/coordinates";
import { clamp } from "../../../utils";
import { useTextPreviewMap } from "./useTextPreviewMap";
import { applyDefaultSnap } from "../geometry/snap";
import type { ViewTransform } from "../model/view";
import { useSvgImportFlow } from "./useSvgImportFlow";
import { renameGroup, reorderShapes, toggleGroupCollapsed } from "../model/grouping";

type UseCadEditorParams = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  setDocumentSilently: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onGenerateGCode: (gcode: string) => void;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onSelectionChangeSilently: (selection: SelectionState) => void;
  view: ViewTransform;
  onViewChange: React.Dispatch<React.SetStateAction<ViewTransform>>;
  onViewChangeSilently: React.Dispatch<React.SetStateAction<ViewTransform>>;
  checkpointHistory: () => void;
};

type PanState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
} | null;

export function useCadEditor({
  document,
  setDocument,
  setDocumentSilently,
  onGenerateGCode,
  selection,
  onSelectionChange,
  onSelectionChangeSilently,
  view,
  onViewChange,
  onViewChangeSilently,
  checkpointHistory,
}: UseCadEditorParams) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tool, setTool] = useState<SketchTool>("select");
  const [draft, setDraft] = useState<DraftShape>(null);
  const [polylineDraft, setPolylineDraft] = useState<SketchPolylinePoint[]>([]);
  const [textTool, setTextTool] = useState(createDefaultTextToolState());
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragState, setDragState] = useState<DragState>(null);
  const [panState, setPanState] = useState<PanState>(null);

  const textPreviewMap = useTextPreviewMap(document.shapes);

  function renameGroupById(groupId: string, name: string) {
    setDocument((prev) => renameGroup(prev, groupId, name));
  }

  function toggleGroupCollapsedById(groupId: string) {
    setDocument((prev) => toggleGroupCollapsed(prev, groupId));
  }

  function reorderDocumentShapes(orderedIds: string[]) {
    checkpointHistory();
    setDocument((prev) => reorderShapes(prev, orderedIds));
  }

  const {
    svgImport,
    startSvgImport,
    closeSvgImport,
    abortSvgImport,
    updateSvgImportDraft,
    confirmSvgImport,
  } = useSvgImportFlow({
    onConfirm: (payload) => {
      const shape = createSvgShape({
        name: payload.name,
        contours: payload.contours,
        sourceWidth: payload.sourceWidth,
        sourceHeight: payload.sourceHeight,
        width: payload.width,
        height: payload.height,
        x: payload.x,
        y: payload.y,
        preserveAspectRatio: true,
      });

      checkpointHistory();
      setDocument((prev) => addShape(prev, shape));
      onSelectionChange(selectOnly(shape.id));
    },
  });

  function normalizePoint(point: SketchPolylinePoint): SketchPolylinePoint {
    if (!document.snapEnabled) {
      return point;
    }

    return applyDefaultSnap(point, {
      gridStep: Math.max(1, document.snapStep),
      shapes: document.shapes,
    });
  }

  function resetView() {
    onViewChange(createDefaultView());
  }

  function addRectangle(x: number, y: number, width: number, height: number) {
    if (width < 1 || height < 1) return;

    const shape = createRectangleShape(
      `Rectangle ${document.shapes.filter((s) => s.type === "rectangle").length + 1}`,
      x,
      y,
      width,
      height,
    );

    setDocument((prev) => addShape(prev, shape));
    onSelectionChange(selectOnly(shape.id));
  }

  function addCircle(cx: number, cy: number, radius: number) {
    if (radius < 1) return;

    const shape = createCircleShape(
      `Circle ${document.shapes.filter((s) => s.type === "circle").length + 1}`,
      cx,
      cy,
      radius,
    );

    setDocument((prev) => addShape(prev, shape));
    onSelectionChange(selectOnly(shape.id));
  }

  function addText(x: number, y: number) {
    const value = textTool.text.trim();
    if (!value) return;

    const shape = createTextShape(
      `Text ${document.shapes.filter((s) => s.type === "text").length + 1}`,
      x,
      y,
      value,
      Math.max(2, textTool.height),
      Math.max(0, textTool.letterSpacing),
      textTool.fontFile,
    );

    setDocument((prev) => addShape(prev, shape));
    onSelectionChange(selectOnly(shape.id));
  }

  function commitPolyline() {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      return;
    }

    const shape = createPolylineShape(
      `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      polylineDraft,
      false,
    );

    setDocument((prev) => addShape(prev, shape));
    onSelectionChange(selectOnly(shape.id));
    setPolylineDraft([]);
  }

  function getCadPoint(event: React.PointerEvent<SVGElement>) {
    if (!svgRef.current) return null;

    const rect = svgRef.current.getBoundingClientRect();
    return screenToCadPoint(
      event.clientX,
      event.clientY,
      rect,
      document.height,
      view,
    );
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 1) {
      event.preventDefault();
      checkpointHistory();
      setPanState({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: view.offsetX,
        startOffsetY: view.offsetY,
      });
      return;
    }

    if (event.button !== 0) return;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    if (tool === "rectangle") {
      setDraft(startRectangleDraft(cad.x, cad.y));
      return;
    }

    if (tool === "circle") {
      setDraft(startCircleDraft(cad.x, cad.y));
      return;
    }

    if (tool === "polyline") {
      setPolylineDraft((prev) => appendPolylinePoint(prev, { x: cad.x, y: cad.y }));
      return;
    }

    if (tool === "text") {
      addText(cad.x, cad.y);
      return;
    }

    if (tool === "select") {
      onSelectionChangeSilently(clearSelection());
    }
  }

  function handleCanvasPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (panState && panState.pointerId === event.pointerId) {
      onViewChangeSilently((prev) => ({
        ...prev,
        offsetX: panState.startOffsetX + (event.clientX - panState.startClientX),
        offsetY: panState.startOffsetY + (event.clientY - panState.startClientY),
      }));
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    if (draft) {
      setDraft((prev) => updateDraft(prev, cad.x, cad.y));
      return;
    }

    if (dragState) {
      const next = updateDrag(dragState, cad.x, cad.y);
      if (!next) return;

      const selectedIds =
        dragState.selectionIds.length > 0
          ? dragState.selectionIds
          : [dragState.shapeId];

      setDocumentSilently((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) =>
          selectedIds.includes(shape.id) ? moveShape(shape, next.dx, next.dy) : shape,
        ),
      }));

      setDragState(next.next);
    }
  }

  function handleCanvasPointerUp() {
    if (draft?.type === "rectangle") {
      const rect = getRectangleFromDraft(draft);
      addRectangle(rect.x, rect.y, rect.width, rect.height);
    }

    if (draft?.type === "circle") {
      const circle = getCircleFromDraft(draft);
      addCircle(circle.cx, circle.cy, circle.radius);
    }

    setDraft(null);
    setDragState(finishDrag());
    setPanState(null);
  }

  function handleCanvasWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;

    const direction = event.deltaY < 0 ? 1 : -1;
    const zoomStep = 0.06;
    const zoomFactor = 1 + direction * zoomStep;

    onViewChange((prev) => {
      const nextScale = clamp(prev.scale * zoomFactor, 0.25, 20);
      const ratio = nextScale / prev.scale;

      return {
        scale: nextScale,
        offsetX: anchorX - (anchorX - prev.offsetX) * ratio,
        offsetY: anchorY - (anchorY - prev.offsetY) * ratio,
      };
    });
  }

  function deleteSelected() {
    if (selection.ids.length === 0) return;

    const nextDocument = {
      ...document,
      shapes: document.shapes.filter((shape) => !selection.ids.includes(shape.id)),
    };

    setDocument(nextDocument);
    onSelectionChange(normalizeSelectionAfterDelete(nextDocument, clearSelection()));
  }

  function deleteShape(shapeId: string) {
    checkpointHistory();

    const nextDocument = {
      ...document,
      shapes: document.shapes.filter((shape) => shape.id !== shapeId),
    };

    setDocument(nextDocument);
    onSelectionChange(normalizeSelectionAfterDelete(nextDocument, selection));
  }

  function renameShape(shapeId: string, name: string) {
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, name } : shape,
      ),
    }));
  }

  function toggleShapeVisibility(shapeId: string) {
    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, visible: !(shape.visible !== false) } : shape,
      ),
    }));
  }

  function groupSelected() {
    checkpointHistory();
    setDocument((prev) => groupSelectedShapes(prev, selection));
  }

  function ungroupSelected() {
    checkpointHistory();
    setDocument((prev) => ungroupSelectedShapes(prev, selection));
  }

  function bindSelectStart(event: React.PointerEvent<SVGElement>, shapeId: string) {
    event.stopPropagation();

    if (event.button === 1) {
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    let nextSelection: SelectionState;

    if (event.shiftKey) {
      nextSelection = toggleSelection(selection, shapeId);
    } else if (isSelected(selection, shapeId)) {
      nextSelection = selection;
    } else {
      nextSelection = selectOnly(shapeId);
    }

    if (nextSelection !== selection) {
      onSelectionChangeSilently(nextSelection);
    }

    if (tool !== "select" || event.button !== 0) {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    checkpointHistory();

    setDragState(
      startDrag(
        shapeId,
        cad.x,
        cad.y,
        getDragShapeIds(document, shapeId, nextSelection),
      ),
    );
  }

  function bindSelectionDragStart(event: React.PointerEvent<SVGRectElement>) {
    event.stopPropagation();

    if (tool !== "select" || event.button !== 0) {
      return;
    }

    if (!selection.primaryId) {
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    checkpointHistory();

    setDragState(
      startDrag(
        selection.primaryId,
        cad.x,
        cad.y,
        getDragShapeIds(document, selection.primaryId, selection),
      ),
    );
  }

  async function handleGenerateClick() {
    setIsGenerating(true);

    try {
      const gcode = await generateSketchGCode(document);
      onGenerateGCode(gcode);
    } finally {
      setIsGenerating(false);
    }
  }

  return {
    svgRef,
    tool,
    setTool,
    draft,
    polylineDraft,
    textTool,
    setTextTool,
    textPreviewMap,
    isGenerating,
    view,
    resetView,
    commitPolyline,
    deleteSelected,
    deleteShape,
    renameShape,
    toggleShapeVisibility,
    groupSelected,
    ungroupSelected,
    handleGenerateClick,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
    bindSelectStart,
    bindSelectionDragStart,
    fontOptions: DEFAULT_FONT_OPTIONS,

    svgImport,
    startSvgImport,
    closeSvgImport,
    abortSvgImport,
    updateSvgImportDraft,
    confirmSvgImport,

    renameGroup: renameGroupById,
    toggleGroupCollapsed: toggleGroupCollapsedById,
    reorderDocumentShapes,
  };
}
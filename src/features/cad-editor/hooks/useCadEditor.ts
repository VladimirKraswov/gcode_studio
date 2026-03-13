import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  startArcRadiusDraft,
  startCircleDraft,
  startLineDraft,
  startRectangleDraft,
  updateDraft,
} from "../editor-state/commands";
import {
  DEFAULT_FONT_OPTIONS,
} from "../editor-state/textToolState";
import {
  getArcFromDraft,
  getCircleFromDraft,
  getLineFromDraft,
} from "../geometry/draftGeometry";
import { addShape } from "../model/document";
import {
  createArcShape,
  createCircleShape,
  createLineShape,
  createSvgShape,
  createTextShape,
  createEllipseShape,
} from "../model/shapeFactory";
import { createId } from "../model/ids";
import { hitTestShapes } from "../geometry/hitTest";
import type {
  SketchDocument,
  SketchPolylinePoint,
  MirrorAxis,
  SketchBSpline,
} from "../model/types";
import type { SelectionState } from "../model/selection";
import {
  clearSelection,
  makePointRef,
  makeShapeRef,
} from "../model/selection";
import {
  groupSelectedShapes,
  ungroupSelectedShapes,
} from "../model/grouping";
import { generateSketchGCode } from "../cam/generateSketchGCode";
import { screenToCadPoint } from "@/utils/coordinates";
import { useTextPreviewMap } from "./useTextPreviewMap";
import { resolveSnap } from "../geometry/snap";
import type { ViewTransform } from "../model/view";
import { useSvgImportFlow } from "./useSvgImportFlow";
import {
  renameGroup as modelRenameGroup,
  reorderShapes as modelReorderShapes,
  toggleGroupCollapsed as modelToggleGroupCollapsed,
} from "../model/grouping";
import type { CadPanButtonMode } from "@/shared/utils/settings";
import { createConstraint } from "../model/constraints";
import { distance } from "../geometry/distance";
import { updateGeometry } from "../model/solver/manager";
import { analyzeSketchDiagnostics } from "../model/solver/diagnostics";
import {
  cloneSelectedEntities,
  deleteSelectedEntities,
  deleteShapeCascade,
  mirrorSelectedEntities,
} from "../model/editorFacade";
import { materializeSnappedPoint } from "../model/constraintFacade";
import {
  isPointSelectionId,
  resolveDragSelectionIds,
  resolveSelectionOnPointerDown,
  buildGroupShapeSelection,
  getEntitiesInBox,
} from "../model/selectionFacade";
import { toState } from "../model/selection";

import { useCadDrawing } from "./useCadDrawing";
import { useCadView } from "./useCadView";
import { useCadArray } from "./useCadArray";
import { useCadDrag } from "./useCadDrag";
import { useCadConstraints } from "./useCadConstraints";

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
  panButtonMode: CadPanButtonMode;
};

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function isSamePoint(
  a: SketchPolylinePoint | null | undefined,
  b: SketchPolylinePoint | null | undefined,
  epsilon = 0.001,
): boolean {
  if (!a || !b) return false;
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

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
  panButtonMode,
}: UseCadEditorParams) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelectionHover, setIsSelectionHover] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null>(null);

  const {
    tool, setTool: setToolDrawing, draft, setDraft, polylineDraft, setPolylineDraft,
    polylineHoverPoint, setPolylineHoverPoint, textTool, setTextTool,
    resetDrafts, commitPolyline, commitBSpline, focusCreatedShape,
    insertControlPointToSelectedBSpline, removeSelectedPointFromBSpline
  } = useCadDrawing(
    document, setDocument, checkpointHistory, onSelectionChange, onSelectionChangeSilently
  );

  const setTool = useCallback((nextTool: any) => {
    setToolDrawing(nextTool, () => {
        onSelectionChangeSilently(clearSelection());
        setIsSelectionHover(false);
    });
  }, [setToolDrawing, onSelectionChangeSilently]);

  const {
    panState, setPanState, isPanMouseButton, startPan, handleCanvasWheel, resetView
  } = useCadView({
    view, onViewChange, onViewChangeSilently, checkpointHistory, panButtonMode
  });

  const {
    arrayTool, arrayPreview, setArrayToolMode, setEditingArrayGroupId,
    updateLinearArrayParams, updateCircularArrayParams, setLinearArrayParamsState, setCircularArrayParamsState,
    startLinearArray, startCircularArray, applyArray, closeArrayTool
  } = useCadArray(document, setDocument, selection, onSelectionChange, checkpointHistory);

  const { dragState, setDragState, handleDrag, endDrag } = useCadDrag({ document, setDocumentSilently });

  const textPreviewMap = useTextPreviewMap(document.shapes, document.points);
  const diagnostics = useMemo(() => analyzeSketchDiagnostics(document), [document]);

  const getCadPoint = useCallback((event: React.PointerEvent<SVGElement>) => {
    if (!svgRef.current) return null;
    return screenToCadPoint(event.clientX, event.clientY, svgRef.current.getBoundingClientRect(), document.height, view);
  }, [document.height, view]);

  const bindSelectStart = useCallback((event: React.PointerEvent<SVGElement>, rawId: string) => {
    if (tool !== "select") return;
    if (isPanMouseButton(event.button)) {
      event.stopPropagation();
      startPan(event);
      return;
    }
    event.stopPropagation();

    const { ref, nextSelection } = resolveSelectionOnPointerDown({
      selection, rawId, shiftKey: event.shiftKey,
    });

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = document.snapEnabled ? resolveSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points, shapes: document.shapes, tolerance: 6 }).point : rawCad;

    if (nextSelection !== selection) {
      onSelectionChangeSilently(nextSelection);
    }
    if (event.button !== 0 || event.shiftKey) return;
    checkpointHistory();

    const dragIds = resolveDragSelectionIds({ document, ref, nextSelection });
    if (ref.kind === "point") {
      setDragState({ shapeId: `point:${ref.id}`, startX: cad.x, startY: cad.y, selectionIds: dragIds });
    } else if (ref.kind === "shape") {
      setDragState({ shapeId: ref.id, startX: cad.x, startY: cad.y, selectionIds: dragIds });
    }
  }, [tool, isPanMouseButton, startPan, selection, document, onSelectionChangeSilently, checkpointHistory, setDragState, getCadPoint]);

  const {
    addQuickConstraint, onConstraintPointerDown, updateConstraintValue, deleteConstraintById
  } = useCadConstraints({
    document, setDocument, selection, onSelectionChangeSilently, checkpointHistory, bindSelectStart
  });

  const cancelCurrentDraft = useCallback(() => {
    resetDrafts();
    setDragState(null);
    setIsSelectionHover(false);
  }, [resetDrafts, setDragState]);

  const editArrayGroupById = useCallback((groupId: string) => {
    const group = document.groups.find((item) => item.id === groupId);
    if (!group?.array) return;
    const sourceIds = group.array.sourceShapeIds.filter((id) => document.shapes.some((shape) => shape.id === id));
    if (sourceIds.length === 0) return;
    onSelectionChange({ refs: sourceIds.map((id) => makeShapeRef(id)), primaryRef: makeShapeRef(sourceIds[0] ?? ""), ids: sourceIds, primaryId: sourceIds[0] ?? null });
    setEditingArrayGroupId(groupId);
    if (group.array.type === "linear") {
      setLinearArrayParamsState(group.array.params as any);
      setArrayToolMode("linear");
    } else {
      setCircularArrayParamsState(group.array.params as any);
      setArrayToolMode("circular");
    }
  }, [document.groups, document.shapes, onSelectionChange, setEditingArrayGroupId, setLinearArrayParamsState, setArrayToolMode, setCircularArrayParamsState]);

  useEffect(() => {
    const handleEditArrayGroup = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId?: string }>;
      const groupId = customEvent.detail?.groupId;
      if (groupId) editArrayGroupById(groupId);
    };
    window.addEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);
    return () => window.removeEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);
  }, [editArrayGroupById]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName?.toLowerCase() === "input" || target?.tagName?.toLowerCase() === "textarea" || target?.isContentEditable) return;
      if (tool !== "polyline" && tool !== "bspline") return;
      if (event.key === "Enter" && polylineDraft.length >= 2) {
        event.preventDefault();
        if (tool === "polyline") commitPolyline();
        else commitBSpline();
      }
      if (event.key === "Escape") {
        if (polylineDraft.length > 0) {
          event.preventDefault();
          setPolylineDraft([]);
          setPolylineHoverPoint(null);
          setIsSelectionHover(false);
        } else if (selection.ids.length > 0) {
          event.preventDefault();
          onSelectionChangeSilently(clearSelection());
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [polylineDraft, tool, commitPolyline, commitBSpline, setPolylineDraft, setPolylineHoverPoint]);

  const { svgImport, startSvgImport, closeSvgImport, abortSvgImport, updateSvgImportDraft, confirmSvgImport } = useSvgImportFlow({
    onConfirm: (payload) => {
      const shape = createSvgShape({ name: payload.name, x: payload.x, y: payload.y, contours: payload.contours.map((c) => c.map((p) => `${p.x},${p.y}`)), sourceWidth: payload.sourceWidth, sourceHeight: payload.sourceHeight, width: payload.width, height: payload.height, preserveAspectRatio: true });
      checkpointHistory();
      setDocument(addShape(document, shape));
      focusCreatedShape(shape.id);
    },
  });

  const addCircle = useCallback((cx: number, cy: number, radius: number) => {
    if (radius < 1) return;
    let nextDoc = { ...document };
    const centerRes = materializeSnappedPoint(nextDoc, { x: cx, y: cy });
    nextDoc = centerRes.document;

    const shape = createCircleShape(`Circle ${document.shapes.filter((s) => s.type === "circle").length + 1}`, centerRes.pointId, radius);
    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (distance({ x: x1, y: y1 }, { x: x2, y: y2 }) < 0.5) return;
    let nextDoc = { ...document };
    const first = materializeSnappedPoint(nextDoc, { x: x1, y: y1 });
    nextDoc = first.document;
    const second = materializeSnappedPoint(nextDoc, { x: x2, y: y2 });
    nextDoc = second.document;
    const p1Id = first.pointId;
    const p2Id = second.pointId;
    if (p1Id === p2Id) return;
    const p1 = nextDoc.points.find((p) => p.id === p1Id);
    const p2 = nextDoc.points.find((p) => p.id === p2Id);
    if (!p1 || !p2) return;
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    if (dy < dx * 0.05) nextDoc.constraints.push(createConstraint("horizontal", [p1.id, p2.id]));
    else if (dx < dy * 0.05) nextDoc.constraints.push(createConstraint("vertical", [p1.id, p2.id]));
    const shape = createLineShape(`Line ${document.shapes.filter((s) => s.type === "line").length + 1}`, p1.id, p2.id);
    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addArc = useCallback((cx: number, cy: number, radius: number, _startAngle: number, _endAngle: number, p1x: number, p1y: number, p2x: number, p2y: number, clockwise = false) => {
    if (radius < 1) return;

    let nextDoc = { ...document };
    const centerRes = materializeSnappedPoint(nextDoc, { x: cx, y: cy });
    nextDoc = centerRes.document;

    const p1Res = materializeSnappedPoint(nextDoc, { x: p1x, y: p1y });
    nextDoc = p1Res.document;

    const p2Res = materializeSnappedPoint(nextDoc, { x: p2x, y: p2y });
    nextDoc = p2Res.document;

    const shape = createArcShape({
      name: `Arc ${document.shapes.filter((s) => s.type === "arc").length + 1}`,
      center: centerRes.pointId,
      p1: p1Res.pointId,
      p2: p2Res.pointId,
      clockwise,
      radius
    });

    // Add constraints to maintain radius
    nextDoc.constraints.push(createConstraint("distance", [centerRes.pointId, p1Res.pointId], radius));
    nextDoc.constraints.push(createConstraint("distance", [centerRes.pointId, p2Res.pointId], radius));

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addRectangle = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5) return;
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2), minY = Math.min(y1, y2), maxY = Math.max(y1, y2);

    let nextDoc = { ...document };
    const p1Res = materializeSnappedPoint(nextDoc, { x: minX, y: minY });
    nextDoc = p1Res.document;
    const p2Res = materializeSnappedPoint(nextDoc, { x: maxX, y: minY });
    nextDoc = p2Res.document;
    const p3Res = materializeSnappedPoint(nextDoc, { x: maxX, y: maxY });
    nextDoc = p3Res.document;
    const p4Res = materializeSnappedPoint(nextDoc, { x: minX, y: maxY });
    nextDoc = p4Res.document;

    const groupId = createId("group");
    const rectIndex = document.groups.filter((g) => g.name.startsWith("Rectangle")).length + 1;
    const l1 = { ...createLineShape(`Rectangle ${rectIndex} - Bottom`, p1Res.pointId, p2Res.pointId), groupId };
    const l2 = { ...createLineShape(`Rectangle ${rectIndex} - Right`, p2Res.pointId, p3Res.pointId), groupId };
    const l3 = { ...createLineShape(`Rectangle ${rectIndex} - Top`, p3Res.pointId, p4Res.pointId), groupId };
    const l4 = { ...createLineShape(`Rectangle ${rectIndex} - Left`, p4Res.pointId, p1Res.pointId), groupId };

    const nextConstraints = [
      createConstraint("horizontal", [p1Res.pointId, p2Res.pointId]),
      createConstraint("vertical", [p2Res.pointId, p3Res.pointId]),
      createConstraint("horizontal", [p3Res.pointId, p4Res.pointId]),
      createConstraint("vertical", [p4Res.pointId, p1Res.pointId])
    ];

    checkpointHistory();
    const finalDoc = updateGeometry({
      ...nextDoc,
      shapes: [...nextDoc.shapes, l1, l2, l3, l4],
      groups: [...nextDoc.groups, { id: groupId, name: `Rectangle ${rectIndex}`, collapsed: false }],
      constraints: [...nextDoc.constraints, ...nextConstraints]
    });
    setDocument(finalDoc);
    setTool("select");
    onSelectionChange(buildGroupShapeSelection([l1, l2, l3, l4]));
    resetDrafts();
    setIsSelectionHover(false);
  }, [document, checkpointHistory, setDocument, onSelectionChange, setTool, resetDrafts]);

  const addEllipse = useCallback((cx: number, cy: number, mx: number, my: number) => {
    let nextDoc = { ...document };
    const centerRes = materializeSnappedPoint(nextDoc, { x: cx, y: cy });
    nextDoc = centerRes.document;
    const majorRes = materializeSnappedPoint(nextDoc, { x: mx, y: my });
    nextDoc = majorRes.document;

    const p1 = nextDoc.points.find(p => p.id === centerRes.pointId);
    const p2 = nextDoc.points.find(p => p.id === majorRes.pointId);
    if (!p1 || !p2) return;

    const dist = distance(p1, p2);
    if (dist < 1) return;

    const shape = createEllipseShape(`Ellipse ${document.shapes.filter((s) => s.type === "ellipse").length + 1}`, centerRes.pointId, majorRes.pointId, dist * 0.6);
    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addText = useCallback((x: number, y: number) => {
    const value = textTool.text.trim();
    if (!value) return;
    const shape = createTextShape(`Text ${document.shapes.filter((s) => s.type === "text").length + 1}`, x, y, value, Math.max(2, textTool.height), Math.max(0, textTool.letterSpacing), textTool.fontFile);
    checkpointHistory();
    setDocument(addShape(document, shape));
    focusCreatedShape(shape.id);
  }, [document, textTool, checkpointHistory, setDocument, focusCreatedShape]);

  const handleCanvasPointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button === 2 && (draft || polylineDraft.length > 0)) { event.preventDefault(); cancelCurrentDraft(); return; }
    if (isPanMouseButton(event.button)) { startPan(event, { clearSelectionOnPointerUp: tool === "select" && event.button === 2 && selection.ids.length > 0 }); return; }
    if (event.button !== 0) return;
    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = document.snapEnabled ? resolveSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points, shapes: document.shapes, tolerance: 6 }).point : rawCad;
    if (tool === "rectangle") { setDraft(startRectangleDraft(cad.x, cad.y)); return; }
    if (tool === "circle") { setDraft(startCircleDraft(cad.x, cad.y)); return; }
    if (tool === "line") { setDraft(startLineDraft(cad.x, cad.y)); return; }
    if (tool === "ellipse") { setDraft({ type: "line", startX: cad.x, startY: cad.y, endX: cad.x, endY: cad.y }); return; }
    if (tool === "arc") {
      if (!draft) { setDraft(startArcRadiusDraft(cad.x, cad.y)); return; }
      if (draft.type === "arc" && draft.stage === "radius") {
        if (distance({ x: draft.centerX, y: draft.centerY }, { x: cad.x, y: cad.y }) < 0.5) return;
        setDraft({ type: "arc", stage: "sweep", centerX: draft.centerX, centerY: draft.centerY, startX: cad.x, startY: cad.y, endX: cad.x, endY: cad.y, clockwise: false });
        return;
      }
      if (draft.type === "arc" && draft.stage === "sweep") {
        const committed = getArcFromDraft({ ...draft, endX: cad.x, endY: cad.y });
        if (committed) addArc(
          committed.cx, committed.cy, committed.radius,
          committed.startAngle, committed.endAngle,
          draft.startX, draft.startY, cad.x, cad.y,
          committed.clockwise
        );
        setDraft(null); return;
      }
    }
    if (tool === "polyline" || tool === "bspline") {
      setPolylineDraft((prev) => { const last = prev[prev.length - 1]; if (isSamePoint(last, cad)) return prev; return [...prev, cad]; });
      setPolylineHoverPoint(cad); return;
    }
    if (tool === "text") { addText(cad.x, cad.y); return; }
    if (tool === "trim") {
      const hit = hitTestShapes(cad, document.shapes, document.points);
      if (hit) { checkpointHistory(); setDocument((prev) => deleteShapeCascade(prev, hit.id)); }
      return;
    }
    if (tool === "select") {
      setSelectionBox({
        startX: cad.x,
        startY: cad.y,
        endX: cad.x,
        endY: cad.y,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false,
      });
    }
  }, [tool, draft, polylineDraft, isPanMouseButton, startPan, getCadPoint, document, addText, addArc, cancelCurrentDraft, checkpointHistory, setDocument, onSelectionChangeSilently, selection.ids.length, setDraft, setPolylineDraft, setPolylineHoverPoint]);

  const handleCanvasPointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (panState && panState.pointerId === event.pointerId) {
      const moved = Math.abs(event.clientX - panState.startClientX) > 2 || Math.abs(event.clientY - panState.startClientY) > 2;
      if (moved && !panState.moved) setPanState((prev) => (prev ? { ...prev, moved: true } : prev));
      onViewChangeSilently((prev) => ({ ...prev, offsetX: panState.startOffsetX + (event.clientX - panState.startClientX), offsetY: panState.startOffsetY + (event.clientY - panState.startClientY) }));
      return;
    }
    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = document.snapEnabled ? resolveSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points, shapes: document.shapes, tolerance: 6 }).point : rawCad;
    if (tool === "polyline" || tool === "bspline") setPolylineHoverPoint(cad);
    if (draft) { setDraft((prev) => updateDraft(prev as any, cad.x, cad.y)); return; }
    if (selectionBox) {
      const dist = Math.sqrt(
        Math.pow(event.clientX - selectionBox.startClientX, 2) +
        Math.pow(event.clientY - selectionBox.startClientY, 2)
      );
      setSelectionBox((prev) => prev ? { ...prev, endX: cad.x, endY: cad.y, moved: prev.moved || dist > 5 } : null);
    }
    handleDrag(cad);
  }, [panState, tool, draft, getCadPoint, document, onViewChangeSilently, handleDrag, setPanState, setPolylineHoverPoint, setDraft, selectionBox]);

  const handleCanvasPointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (draft?.type === "rectangle") addRectangle(draft.startX, draft.startY, draft.endX, draft.endY);
    else if (draft?.type === "circle") { const circle = getCircleFromDraft(draft); addCircle(circle.cx, circle.cy, circle.radius); }
    else if (draft?.type === "line") {
      if (tool === "ellipse") addEllipse(draft.startX, draft.startY, draft.endX, draft.endY);
      else { const line = getLineFromDraft(draft); addLine(line.x1, line.y1, line.x2, line.y2); }
    }

    if (draft && draft.type !== "arc") setDraft(null);

    if (selectionBox) {
      if (selectionBox.moved) {
        const minX = Math.min(selectionBox.startX, selectionBox.endX);
        const maxX = Math.max(selectionBox.startX, selectionBox.endX);
        const minY = Math.min(selectionBox.startY, selectionBox.endY);
        const maxY = Math.max(selectionBox.startY, selectionBox.endY);

        const refs = getEntitiesInBox(document, minX, minY, maxX, maxY);
        if (event.shiftKey) {
            let nextRefs = [...selection.refs];
            for (const ref of refs) {
                if (!nextRefs.some(r => r.kind === ref.kind && r.id === ref.id)) {
                    nextRefs.push(ref);
                }
            }
            onSelectionChangeSilently(toState(nextRefs, nextRefs[nextRefs.length - 1] || null));
        } else {
            onSelectionChangeSilently(toState(refs, refs.length > 0 ? refs[refs.length - 1] : null));
        }
      } else {
        if (!event.shiftKey) {
          onSelectionChangeSilently(clearSelection());
        }
      }
      setSelectionBox(null);
    }

    if (panState && panState.pointerId === event.pointerId) {
      if (panState.clearSelectionOnPointerUp && !panState.moved && tool === "select") onSelectionChangeSilently(clearSelection());
      setPanState(null);
    }
    endDrag();
  }, [draft, tool, panState, addRectangle, addCircle, addEllipse, addLine, onSelectionChangeSilently, setDraft, setPanState, endDrag, selectionBox, document, selection.refs]);

  const bindSelectionDragStart = useCallback((event: React.PointerEvent<SVGRectElement>) => {
    if (isPanMouseButton(event.button)) { startPan(event); return; }
    if (tool !== "select" || event.button !== 0 || !selection.primaryId) return;
    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = document.snapEnabled ? resolveSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points, shapes: document.shapes, tolerance: 6 }).point : rawCad;
    checkpointHistory();
    setDragState({ shapeId: selection.primaryId, startX: cad.x, startY: cad.y, selectionIds: resolveDragSelectionIds({ document, ref: isPointSelectionId(selection.primaryId) ? makePointRef(selection.primaryId) : makeShapeRef(selection.primaryId), nextSelection: selection }) });
  }, [isPanMouseButton, startPan, tool, selection, getCadPoint, document, checkpointHistory, setDragState]);

  const resetViewWithHover = useCallback(() => { resetView(); setIsSelectionHover(false); }, [resetView]);

  const cloneSelected = useCallback(() => { checkpointHistory(); const result = cloneSelectedEntities(document, selection); setDocument(result.document); onSelectionChange(result.selection); }, [document, selection, checkpointHistory, setDocument, onSelectionChange]);
  const mirrorSelected = useCallback((axis: MirrorAxis) => { checkpointHistory(); setDocument((prev) => mirrorSelectedEntities(prev, selection, axis)); }, [selection, checkpointHistory, setDocument]);
  const deleteSelected = useCallback(() => { checkpointHistory(); const result = deleteSelectedEntities(document, selection); setDocument(result.document); onSelectionChange(result.selection); }, [document, selection, checkpointHistory, setDocument, onSelectionChange]);
  const deleteShape = useCallback((id: string) => setDocument((doc) => deleteShapeCascade(doc, id)), [setDocument]);
  const renameShape = useCallback((id: string, name: string) => setDocument((doc) => ({ ...doc, shapes: doc.shapes.map((shape) => (shape.id === id ? { ...shape, name } : shape)) })), [setDocument]);
  const toggleShapeVisibility = useCallback((id: string) => setDocument((doc) => ({ ...doc, shapes: doc.shapes.map((shape) => (shape.id === id ? { ...shape, visible: !shape.visible } : shape)) })), [setDocument]);
  const groupSelected = useCallback(() => setDocument((doc) => groupSelectedShapes(doc, selection)), [setDocument, selection]);
  const ungroupSelected = useCallback(() => setDocument((doc) => ungroupSelectedShapes(doc, selection)), [setDocument, selection]);

  const handleGenerateClick = useCallback(async () => {
    setIsGenerating(true);
    try { const gcode = await generateSketchGCode(document); onGenerateGCode(gcode); } finally { setIsGenerating(false); }
  }, [document, onGenerateGCode]);

  const handleCanvasPointerLeave = useCallback(() => { endDrag(); setPanState(null); }, [endDrag, setPanState]);
  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool === "polyline" || tool === "bspline") { e.preventDefault(); if (tool === "polyline") commitPolyline(); else commitBSpline(); }
  }, [tool, commitPolyline, commitBSpline]);

  const toggleConstruction = useCallback(() => {
    if (selection.ids.length === 0) return;
    checkpointHistory();
    setDocument((prev) => ({ ...prev, shapes: prev.shapes.map((shape) => selection.ids.includes(shape.id) ? { ...shape, isConstruction: !shape.isConstruction } : shape) }));
  }, [selection.ids, checkpointHistory, setDocument]);

  const renameGroup = useCallback((id: string, name: string) => setDocument((doc) => modelRenameGroup(doc, id, name)), [setDocument]);
  const toggleGroupCollapsed = useCallback((id: string) => setDocument((doc) => modelToggleGroupCollapsed(doc, id)), [setDocument]);
  const reorderDocumentShapes = useCallback((ids: string[]) => setDocument((doc) => modelReorderShapes(doc, ids)), [setDocument]);

  const setSelectedBSplineDegree = useCallback((nextDegree: number) => {
    if (!selection.primaryId) return;
    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;
    const bspline = shape as SketchBSpline;
    const maxDegree = Math.max(1, bspline.controlPointIds.length - 1);
    const degree = Math.max(1, Math.min(maxDegree, Math.round(nextDegree || 1)));
    checkpointHistory();
    setDocument((prev) => ({ ...prev, shapes: prev.shapes.map((item) => item.id === shape.id ? ({ ...item, degree } as SketchBSpline) : item) }));
  }, [selection.primaryId, document.shapes, checkpointHistory, setDocument]);

  const setSelectedBSplinePeriodic = useCallback((periodic: boolean) => {
    if (!selection.primaryId) return;
    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;
    checkpointHistory();
    setDocument((prev) => ({ ...prev, shapes: prev.shapes.map((item) => item.id === shape.id ? ({ ...item, periodic } as SketchBSpline) : item) }));
  }, [selection.primaryId, document.shapes, checkpointHistory, setDocument]);

  return {
    svgRef, tool, setTool, draft, polylineDraft, polylineHoverPoint, textTool, setTextTool, textPreviewMap, isGenerating, view,
    selectionBox,
    isDragging: !!dragState, isPanning: !!panState, isSelectionHover, setIsSelectionHover, isTransforming: false,
    setSelectedBSplineDegree, setSelectedBSplinePeriodic,
    insertControlPointToSelectedBSpline: insertControlPointToSelectedBSpline(selection),
    removeSelectedPointFromBSpline: removeSelectedPointFromBSpline(selection),
    dof: diagnostics.dof, solveState: diagnostics.solveState, constraintIssues: diagnostics.issues, conflictingConstraintIds: diagnostics.conflictingConstraintIds,
    resetView: resetViewWithHover, commitPolyline, cancelCurrentDraft, cloneSelected, mirrorSelected, deleteSelected, deleteShape, renameShape, toggleShapeVisibility, groupSelected, ungroupSelected,
    handleGenerateClick, handleCanvasPointerDown, handleCanvasPointerMove, handleCanvasPointerUp, handleCanvasPointerLeave, handleCanvasContextMenu, handleCanvasDoubleClick, handleCanvasWheel,
    bindSelectStart, bindSelectionDragStart, bindScaleHandleStart: () => {}, bindRotateHandleStart: () => {}, bindConstraintEdgeHandleStart: () => {}, bindConstraintLabelDragStart: () => {},
    fontOptions: DEFAULT_FONT_OPTIONS, toggleConstruction, svgImport, startSvgImport, closeSvgImport, abortSvgImport, updateSvgImportDraft, confirmSvgImport, renameGroup, toggleGroupCollapsed, reorderDocumentShapes,
    startLinearArray, startCircularArray, applyArray, closeArrayTool, updateLinearArrayParams, updateCircularArrayParams, editArrayGroupById, arrayTool, arrayPreview,
    addQuickConstraint, onConstraintPointerDown, updateConstraintValue, deleteConstraintById,
  };
}

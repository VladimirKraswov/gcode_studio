import { useEffect, useRef, useState } from "react";
import {
  finishDrag,
  startArcRadiusDraft,
  startCircleDraft,
  startLineDraft,
  startRectangleDraft,
  updateDraft,
  updateDrag,
} from "../editor-state/commands";
import type { DragState } from "../editor-state/draftState";
import {
  DEFAULT_FONT_OPTIONS,
  createDefaultTextToolState,
} from "../editor-state/textToolState";
import type { DraftShape } from "../geometry/draftGeometry";
import {
  getArcFromDraft,
  getCircleFromDraft,
  getLineFromDraft,
} from "../geometry/draftGeometry";
import { addShape, addPoint } from "../model/document";
import {
  createArcShape,
  createCircleShape,
  createLineShape,
  createPolylineShape,
  createRectangleShape,
  createSvgShape,
  createTextShape,
  createPoint,
  createEllipseShape,
  createBSplineShape,
} from "../model/shapeFactory";
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
import { generateSketchGCode } from "@/modules/cam/gcode/generator";
import { screenToCadPoint } from "@/utils/coordinates";
import { clamp } from "@/shared/utils/common";
import { useTextPreviewMap } from "./useTextPreviewMap";
import { applyDefaultSnap } from "../geometry/snap";
import type { ViewTransform } from "../model/view";
import { useSvgImportFlow } from "./useSvgImportFlow";
import { renameGroup, reorderShapes, toggleGroupCollapsed } from "../model/grouping";
import type { CadPanButtonMode } from "@/shared/utils/settings";
import {
  createConstraint,
} from "../model/constraints";
import { distance } from "../geometry/distance";
import {
  applyCircularArray,
  applyLinearArray,
  rebuildArrayGroup,
} from "../model/array";
import { movePointsAndSolve, updateGeometry } from "../model/solver/manager";

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

type PanState = {
  pointerId: number;
  button: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  clearSelectionOnPointerUp: boolean;
  moved: boolean;
} | null;

type ArrayToolMode = "linear" | "circular" | null;

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function isSamePoint(
  a: SketchPolylinePoint | null | undefined,
  b: SketchPolylinePoint | null | undefined,
  epsilon = 0.001,
): boolean {
  if (!a || !b) return false;
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

function startDrag(
  shapeId: string,
  x: number,
  y: number,
  selectionIds: string[],
): DragState {
  return {
    shapeId,
    startX: x,
    startY: y,
    selectionIds,
  };
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

  const [tool, setToolState] = useState<SketchTool>("select");
  const [draft, setDraft] = useState<DraftShape>(null);
  const [polylineDraft, setPolylineDraft] = useState<SketchPolylinePoint[]>([]);
  const [polylineHoverPoint, setPolylineHoverPoint] =
    useState<SketchPolylinePoint | null>(null);
  const [textTool, setTextTool] = useState(createDefaultTextToolState());
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragState, setDragState] = useState<DragState>(null);
  const [panState, setPanState] = useState<PanState>(null);
  const [isSelectionHover, setIsSelectionHover] = useState(false);

  const [arrayToolMode, setArrayToolMode] = useState<ArrayToolMode>(null);
  const [editingArrayGroupId, setEditingArrayGroupId] = useState<string | null>(null);

  const [linearArrayParams, setLinearArrayParams] = useState({
    count: 3,
    spacing: 20,
    axis: "x" as "x" | "y" | string,
    direction: "positive" as "positive" | "negative" | "both",
  });

  const [circularArrayParams, setCircularArrayParams] = useState({
    count: 6,
    centerX: 0 as number | string,
    centerY: 0 as number | string,
    radius: 30,
    startAngle: 0,
    endAngle: 360,
    totalAngle: 360,
    rotateItems: true,
    direction: "cw" as "cw" | "ccw"
  });

  const textPreviewMap = useTextPreviewMap(document.shapes, document.points);

  function setTool(nextTool: SketchTool) {
    setToolState(nextTool);
    if (nextTool !== "select") {
      onSelectionChangeSilently(clearSelection());
      setIsSelectionHover(false);
    }
  }

  function focusCreatedShape(shapeId: string) {
    setToolState("select");
    onSelectionChange(selectOnly(shapeId));
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setIsSelectionHover(false);
  }

  function commitPolyline() {
    if (polylineDraft.length < 2) { setPolylineDraft([]); setPolylineHoverPoint(null); return; }
    checkpointHistory();
    let nextDoc = { ...document };
    const pids = polylineDraft.map((p) => {
      const pt = createPoint(p.x, p.y);
      nextDoc = addPoint(nextDoc, pt);
      return pt.id;
    });
    const shape = createPolylineShape(`Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`, pids, false);
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function commitBSpline() {
    if (polylineDraft.length < 2) { setPolylineDraft([]); setPolylineHoverPoint(null); return; }
    checkpointHistory();
    let nextDoc = { ...document };
    const pids = polylineDraft.map((p) => {
      const pt = createPoint(p.x, p.y);
      nextDoc = addPoint(nextDoc, pt);
      return pt.id;
    });
    const shape = createBSplineShape(`Spline ${document.shapes.filter((s) => s.type === "bspline").length + 1}`, pids);
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function isPanMouseButton(button: number): boolean {
    if (panButtonMode === "middle") return button === 1;
    if (panButtonMode === "right") return button === 2;
    return button === 1 || button === 2;
  }

  function closeArrayTool() { setArrayToolMode(null); setEditingArrayGroupId(null); }
  function startLinearArray() { if (selection.ids.length === 0) return; setEditingArrayGroupId(null); setArrayToolMode("linear"); }
  function startCircularArray() {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("circular");
  }

  function editArrayGroupById(groupId: string) {
    const group = document.groups.find((item) => item.id === groupId);
    if (!group?.array) return;
    const sourceIds = group.array.sourceShapeIds.filter((id) => document.shapes.some((shape) => shape.id === id));
    if (sourceIds.length === 0) return;
    onSelectionChange({ ids: sourceIds, primaryId: sourceIds[0] ?? null });
    setEditingArrayGroupId(groupId);
    if (group.array.type === "linear") { setLinearArrayParams(group.array.params as any); setArrayToolMode("linear"); }
    else { setCircularArrayParams(group.array.params as any); setArrayToolMode("circular"); }
  }

  function applyArray() {
    if (selection.ids.length === 0 || !arrayToolMode) return;
    checkpointHistory();
    if (editingArrayGroupId) {
      const group = document.groups.find((item) => item.id === editingArrayGroupId);
      if (!group?.array) { setEditingArrayGroupId(null); setArrayToolMode(null); return; }
      const nextDefinition: any = arrayToolMode === "linear" ? { type: "linear", sourceShapeIds: group.array.sourceShapeIds, params: linearArrayParams } : { type: "circular", sourceShapeIds: group.array.sourceShapeIds, params: circularArrayParams };
      setDocument(updateGeometry(rebuildArrayGroup(document, editingArrayGroupId, nextDefinition)));
      setEditingArrayGroupId(null); setArrayToolMode(null); return;
    }
    const result = arrayToolMode === "linear" ? applyLinearArray(document, selection, linearArrayParams as any) : applyCircularArray(document, selection, circularArrayParams as any);
    setDocument(updateGeometry(result.document)); setEditingArrayGroupId(null); setArrayToolMode(null);
  }

  useEffect(() => {
    const handleEditArrayGroup = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId?: string }>;
      const groupId = customEvent.detail?.groupId;
      if (groupId) editArrayGroupById(groupId);
    };
    window.addEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);
    return () => window.removeEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);
  }, [document, selection]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName?.toLowerCase() === "input" || target?.tagName?.toLowerCase() === "textarea" || target?.isContentEditable) return;
      if (tool !== "polyline" && tool !== "bspline") return;
      if (event.key === "Enter" && polylineDraft.length >= 2) { event.preventDefault(); if (tool === "polyline") commitPolyline(); else commitBSpline(); }
      if (event.key === "Escape" && polylineDraft.length > 0) { event.preventDefault(); setPolylineDraft([]); setPolylineHoverPoint(null); setIsSelectionHover(false); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [checkpointHistory, document, onSelectionChange, polylineDraft, setDocument, tool]);

  function startPan(event: React.PointerEvent<SVGElement | SVGSVGElement>, options?: { clearSelectionOnPointerUp?: boolean }) {
    event.preventDefault(); setIsSelectionHover(false); checkpointHistory();
    setPanState({ pointerId: event.pointerId, button: event.button, startClientX: event.clientX, startClientY: event.clientY, startOffsetX: view.offsetX, startOffsetY: view.offsetY, clearSelectionOnPointerUp: options?.clearSelectionOnPointerUp ?? false, moved: false });
  }

  const { svgImport, startSvgImport, closeSvgImport, abortSvgImport, updateSvgImportDraft, confirmSvgImport } = useSvgImportFlow({
    onConfirm: (payload) => {
      let nextDoc = { ...document };
      const anchor = createPoint(payload.x, payload.y);
      nextDoc = addPoint(nextDoc, anchor);
      const contours = payload.contours.map(c => c.map(p => { const pt = createPoint(p.x, p.y); nextDoc = addPoint(nextDoc, pt); return pt.id; }));
      const shape = createSvgShape({ name: payload.name, contours, sourceWidth: payload.sourceWidth, sourceHeight: payload.sourceHeight, width: payload.width, height: payload.height, anchorPoint: anchor.id, preserveAspectRatio: true });
      checkpointHistory(); setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
    },
  });

  function getCadPoint(event: React.PointerEvent<SVGElement>) {
    if (!svgRef.current) return null;
    return screenToCadPoint(event.clientX, event.clientY, svgRef.current.getBoundingClientRect(), document.height, view);
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 2 && (draft || polylineDraft.length > 0)) { event.preventDefault(); cancelCurrentDraft(); return; }
    if (isPanMouseButton(event.button)) {
      startPan(event, { clearSelectionOnPointerUp: tool === "select" && event.button === 2 && selection.ids.length > 0 });
      return;
    }
    if (event.button !== 0) return;
    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = document.snapEnabled ? applyDefaultSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points }) : rawCad;
    if (tool === "rectangle") { setDraft(startRectangleDraft(cad.x, cad.y)); return; }
    if (tool === "circle") { setDraft(startCircleDraft(cad.x, cad.y)); return; }
    if (tool === "line") { setDraft(startLineDraft(cad.x, cad.y)); return; }
    if (tool === "ellipse") { setDraft({ type: "line", startX: cad.x, startY: cad.y, endX: cad.x, endY: cad.y }); return; }
    if (tool === "arc") {
      if (!draft) { setDraft(startArcRadiusDraft(cad.x, cad.y)); return; }
      if (draft.type === "arc" && draft.stage === "radius") {
        if (distance({ x: draft.centerX, y: draft.centerY }, { x: cad.x, y: cad.y }) < 0.5) return;
        setDraft({ type: "arc", stage: "sweep", centerX: draft.centerX, centerY: draft.centerY, startX: cad.x, startY: cad.y, endX: cad.x, endY: cad.y, clockwise: false }); return;
      }
      if (draft.type === "arc" && draft.stage === "sweep") {
        const committed = getArcFromDraft({ ...draft, endX: cad.x, endY: cad.y });
        if (committed) { checkpointHistory(); addArc(committed.cx, committed.cy, committed.radius, committed.startAngle, committed.endAngle, committed.clockwise); }
        setDraft(null); return;
      }
    }
    if (tool === "polyline" || tool === "bspline") {
      setPolylineDraft((prev) => { const last = prev[prev.length - 1]; if (isSamePoint(last, cad)) return prev; return [...prev, cad]; });
      setPolylineHoverPoint(cad); return;
    }
    if (tool === "text") { checkpointHistory(); addText(cad.x, cad.y); return; }
    if (tool === "select") onSelectionChangeSilently(clearSelection());
  }

  function handleCanvasPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (panState && panState.pointerId === event.pointerId) { onViewChangeSilently((prev) => ({ ...prev, offsetX: panState.startOffsetX + (event.clientX - panState.startClientX), offsetY: panState.startOffsetY + (event.clientY - panState.startClientY) })); return; }
    const rawCad = getCadPoint(event); if (!rawCad) return;
    const cad = document.snapEnabled ? applyDefaultSnap(rawCad, { gridStep: Math.max(1, document.snapStep), points: document.points }) : rawCad;
    if (tool === "polyline" || tool === "bspline") setPolylineHoverPoint(cad);
    if (draft) { setDraft((prev) => updateDraft(prev as any, cad.x, cad.y)); return; }
    if (dragState) {
      const next = updateDrag(dragState, cad.x, cad.y);
      if (!next) return;
      const selectedIds = dragState.selectionIds.length > 0 ? dragState.selectionIds : [dragState.shapeId];
      const affectedPointIds = new Set<string>();
      document.shapes.filter(s => selectedIds.includes(s.id)).forEach(s => {
        const shape = s as any;
        if ("p1" in shape) affectedPointIds.add(shape.p1); if ("p2" in shape) affectedPointIds.add(shape.p2);
        if ("center" in shape) affectedPointIds.add(shape.center); if ("anchorPoint" in shape) affectedPointIds.add(shape.anchorPoint);
        if ("pointIds" in shape) shape.pointIds.forEach((id: string) => affectedPointIds.add(id));
        if ("controlPointIds" in shape) shape.controlPointIds.forEach((id: string) => affectedPointIds.add(id));
        if ("majorAxisPoint" in shape) affectedPointIds.add(shape.majorAxisPoint);
      });
      setDocumentSilently((prev) => movePointsAndSolve(prev, affectedPointIds, next.dx, next.dy));
      setDragState(next.next); return;
    }
  }

  function handleCanvasPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (draft?.type === "rectangle") { addRectangle(draft.startX, draft.startY, draft.endX, draft.endY); setDraft(null); }
    else if (draft?.type === "circle") { const circle = getCircleFromDraft(draft); addCircle(circle.cx, circle.cy, circle.radius); setDraft(null); }
    else if (draft?.type === "line") { if (tool === "ellipse") addEllipse(draft.startX, draft.startY, draft.endX, draft.endY); else { const line = getLineFromDraft(draft); addLine(line.x1, line.y1, line.x2, line.y2); } setDraft(null); }
    if (panState && panState.pointerId === event.pointerId) { if (panState.clearSelectionOnPointerUp && !panState.moved && tool === "select") onSelectionChangeSilently(clearSelection()); setPanState(null); }
    setDragState(finishDrag());
  }

  function addRectangle(x1: number, y1: number, x2: number, y2: number) {
    if (Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5) return;
    const p1 = createPoint(x1, y1); const p2 = createPoint(x2, y2);
    let nextDoc = addPoint(document, p1); nextDoc = addPoint(nextDoc, p2);
    const shape = createRectangleShape(`Rectangle ${document.shapes.filter((s) => s.type === "rectangle").length + 1}`, p1.id, p2.id);
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function addCircle(cx: number, cy: number, radius: number) {
    if (radius < 1) return;
    const center = createPoint(cx, cy); const nextDoc = addPoint(document, center);
    const shape = createCircleShape(`Circle ${document.shapes.filter((s) => s.type === "circle").length + 1}`, center.id, radius);
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function addLine(x1: number, y1: number, x2: number, y2: number) {
    if (distance({ x: x1, y: y1 }, { x: x2, y: y2 }) < 0.5) return;
    const p1 = createPoint(x1, y1); const p2 = createPoint(x2, y2);
    let nextDoc = addPoint(document, p1); nextDoc = addPoint(nextDoc, p2);
    const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
    if (dy < dx * 0.05) nextDoc.constraints.push(createConstraint("horizontal", [p1.id, p2.id], [], 0));
    else if (dx < dy * 0.05) nextDoc.constraints.push(createConstraint("vertical", [p1.id, p2.id], [], 0));
    const shape = createLineShape(`Line ${document.shapes.filter((s) => s.type === "line").length + 1}`, p1.id, p2.id);
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function addArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, clockwise = false) {
    if (radius < 1) return;
    const center = createPoint(cx, cy);
    const p1 = createPoint(cx + radius * Math.cos((startAngle * Math.PI) / 180), cy + radius * Math.sin((startAngle * Math.PI) / 180));
    const p2 = createPoint(cx + radius * Math.cos((endAngle * Math.PI) / 180), cy + radius * Math.sin((endAngle * Math.PI) / 180));
    let nextDoc = addPoint(document, center); nextDoc = addPoint(nextDoc, p1); nextDoc = addPoint(nextDoc, p2);
    const shape = createArcShape({ name: `Arc ${document.shapes.filter((s) => s.type === "arc").length + 1}`, center: center.id, p1: p1.id, p2: p2.id, clockwise, radius });
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function addEllipse(cx: number, cy: number, mx: number, my: number) {
    const center = createPoint(cx, cy); const major = createPoint(mx, my);
    const dist = distance(center, major); if (dist < 1) return;
    let nextDoc = addPoint(document, center); nextDoc = addPoint(nextDoc, major);
    const shape = createEllipseShape(`Ellipse ${document.shapes.filter((s) => s.type === "ellipse").length + 1}`, center.id, major.id, dist * 0.6);
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function addText(x: number, y: number) {
    const value = textTool.text.trim(); if (!value) return;
    const anchor = createPoint(x, y); const nextDoc = addPoint(document, anchor);
    const shape = createTextShape(`Text ${document.shapes.filter((s) => s.type === "text").length + 1}`, anchor.id, value, Math.max(2, textTool.height), Math.max(0, textTool.letterSpacing), textTool.fontFile);
    setDocument(updateGeometry(addShape(nextDoc, shape))); focusCreatedShape(shape.id);
  }

  function bindSelectStart(event: React.PointerEvent<SVGElement>, shapeId: string) {
    if (tool !== "select") return;
    if (isPanMouseButton(event.button)) { event.stopPropagation(); startPan(event); return; }
    event.stopPropagation();
    const rawCad = getCadPoint(event); if (!rawCad) return;
    const cad = document.snapEnabled ? applyDefaultSnap(rawCad, { points: document.points }) : rawCad;
    let nextSelection = event.shiftKey ? toggleSelection(selection, shapeId) : (isSelected(selection, shapeId) ? selection : selectOnly(shapeId));
    if (nextSelection !== selection) onSelectionChangeSilently(nextSelection);
    if (event.button !== 0 || event.shiftKey) return;
    checkpointHistory();
    setDragState(startDrag(shapeId, cad.x, cad.y, getDragShapeIds(document, shapeId, nextSelection)));
  }

  function bindSelectionDragStart(event: React.PointerEvent<SVGRectElement>) {
    if (isPanMouseButton(event.button)) { startPan(event); return; }
    if (tool !== "select" || event.button !== 0 || !selection.primaryId) return;
    const rawCad = getCadPoint(event); if (!rawCad) return;
    const cad = document.snapEnabled ? applyDefaultSnap(rawCad, { points: document.points }) : rawCad;
    checkpointHistory();
    setDragState(startDrag(selection.primaryId, cad.x, cad.y, getDragShapeIds(document, selection.primaryId, selection)));
  }

  function cancelCurrentDraft() { setDraft(null); setPolylineDraft([]); setPolylineHoverPoint(null); setDragState(null); setIsSelectionHover(false); }

  return {
    svgRef, tool, setTool, draft, polylineDraft, polylineHoverPoint, textTool, setTextTool, textPreviewMap, isGenerating, view, resetView: () => { onViewChange({ scale: 1, offsetX: 0, offsetY: 0 }); setIsSelectionHover(false); }, commitPolyline, cancelCurrentDraft,
    cloneSelected: () => checkpointHistory(), mirrorSelected: () => {},
    deleteSelected: () => {
      checkpointHistory();
      const nextDocument = { ...document, shapes: document.shapes.filter((shape) => !selection.ids.includes(shape.id)), constraints: document.constraints.filter((constraint) => !constraint.shapeIds.some(id => selection.ids.includes(id))) };
      setDocument(nextDocument);
      onSelectionChange(normalizeSelectionAfterDelete(nextDocument, clearSelection()));
    },
    deleteShape: (id: string) => setDocument(d => ({ ...d, shapes: d.shapes.filter(s => s.id !== id) })),
    renameShape: (id: string, name: string) => setDocument(d => { const next = { ...d, shapes: d.shapes.map(s => s.id === id ? { ...s, name } : s) }; return next; }),
    toggleShapeVisibility: (id: string) => setDocument(d => { const next = { ...d, shapes: d.shapes.map(s => s.id === id ? { ...s, visible: !s.visible } : s) }; return next; }),
    groupSelected: () => setDocument(d => groupSelectedShapes(d, selection)),
    ungroupSelected: () => setDocument(d => ungroupSelectedShapes(d, selection)),
    handleGenerateClick: async () => { setIsGenerating(true); try { const gcode = await generateSketchGCode(document); onGenerateGCode(gcode); } finally { setIsGenerating(false); } },
    handleCanvasPointerDown, handleCanvasPointerMove, handleCanvasPointerUp, handleCanvasPointerLeave: (e: any) => handleCanvasPointerUp(e), handleCanvasContextMenu: (e: any) => e.preventDefault(),
    handleCanvasDoubleClick: (e: any) => { if (tool === "polyline" || tool === "bspline") { e.preventDefault(); if (tool === "polyline") commitPolyline(); else commitBSpline(); } },
    handleCanvasWheel: (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      const direction = event.deltaY < 0 ? 1 : -1;
      onViewChange((prev) => {
        const nextScale = clamp(prev.scale * (1 + direction * 0.06), 0.25, 20);
        const ratio = nextScale / prev.scale;
        return { scale: nextScale, offsetX: anchorX - (anchorX - prev.offsetX) * ratio, offsetY: anchorY - (anchorY - prev.offsetY) * ratio };
      });
    },
    bindSelectStart, bindSelectionDragStart, bindScaleHandleStart: () => {}, bindRotateHandleStart: () => {}, bindConstraintEdgeHandleStart: () => {}, bindConstraintLabelDragStart: () => {}, fontOptions: DEFAULT_FONT_OPTIONS,
    svgImport, startSvgImport, closeSvgImport, abortSvgImport, updateSvgImportDraft, confirmSvgImport,
    renameGroup: (id: string, name: string) => setDocument(d => renameGroup(d, id, name)),
    toggleGroupCollapsed: (id: string) => setDocument(d => toggleGroupCollapsed(d, id)),
    reorderDocumentShapes: (ids: string[]) => setDocument(d => reorderShapes(d, ids)),
    startLinearArray, startCircularArray, applyArray, closeArrayTool, updateLinearArrayParams: (p: any) => setLinearArrayParams(prev => ({...prev, ...p})), updateCircularArrayParams: (p: any) => setCircularArrayParams(prev => ({...prev, ...p})), editArrayGroupById,
    arrayTool: { mode: arrayToolMode, linear: linearArrayParams, circular: circularArrayParams, editingGroupId: editingArrayGroupId },
    isDragging: dragState !== null, isPanning: panState !== null, isTransforming: false, isSelectionHover, setIsSelectionHover, arrayPreviewShapes: [], onConstraintPointerDown: (e: any, id: string) => {
      e.stopPropagation();
      const constraint = document.constraints.find(c => c.id === id);
      if (!constraint || !["distance", "distance-x", "distance-y", "radius", "diameter", "angle"].includes(constraint.type)) return;
      const newValStr = window.prompt(`Enter new value for ${constraint.type} constraint:`, String(constraint.value || 0));
      if (newValStr === null) return;
      const newVal = parseFloat(newValStr);
      if (isNaN(newVal)) return;
      checkpointHistory();
      setDocument(prev => {
        const nextConstraints = prev.constraints.map(c => c.id === id ? { ...c, value: newVal } : c);
        return updateGeometry({ ...prev, constraints: nextConstraints });
      });
    }
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
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
import { createId } from "../model/ids";
import { hitTestShapes } from "../geometry/hitTest";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchTool,
  MirrorAxis,
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
import { generateSketchGCode } from "../cam/generateSketchGCode";
import { screenToCadPoint } from "@/utils/coordinates";
import { clamp } from "@/shared/utils/common";
import { useTextPreviewMap } from "./useTextPreviewMap";
import { applyDefaultSnap } from "../geometry/snap";
import type { ViewTransform } from "../model/view";
import { useSvgImportFlow } from "./useSvgImportFlow";
import {
  renameGroup,
  reorderShapes,
  toggleGroupCollapsed,
} from "../model/grouping";
import type { CadPanButtonMode } from "@/shared/utils/settings";
import {
  createConstraint,
  addConstraint,
} from "../model/constraints";
import { distance } from "../geometry/distance";
import {
  applyCircularArray,
  applyLinearArray,
  rebuildArrayGroup,
} from "../model/array";
import { movePointsAndSolve, updateGeometry } from "../model/solver/manager";
import { analyzeSketchDiagnostics } from "../model/solver/diagnostics";
import {
  insertBSplineControlPoint,
  removeBSplineControlPoint,
} from "../geometry/bsplineEditing";

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

function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_");
}

function createDragState(
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
    direction: "cw" as "cw" | "ccw",
  });

  const textPreviewMap = useTextPreviewMap(document.shapes, document.points);

  const diagnostics = useMemo(() => analyzeSketchDiagnostics(document), [document]);
  const dof = diagnostics.dof;

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
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    checkpointHistory();

    let nextDoc = { ...document };
    const pids = polylineDraft.map((p) => {
      const pt = createPoint(p.x, p.y);
      nextDoc = addPoint(nextDoc, pt);
      return pt.id;
    });

    const shape = createPolylineShape(
      `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      pids,
      false,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function commitBSpline() {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    checkpointHistory();

    let nextDoc = { ...document };
    const pids = polylineDraft.map((p) => {
      const pt = createPoint(p.x, p.y);
      nextDoc = addPoint(nextDoc, pt);
      return pt.id;
    });

    const shape = createBSplineShape(
      `Spline ${document.shapes.filter((s) => s.type === "bspline").length + 1}`,
      pids,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function isPanMouseButton(button: number): boolean {
    if (panButtonMode === "middle") return button === 1;
    if (panButtonMode === "right") return button === 2;
    return button === 1 || button === 2;
  }

  function closeArrayTool() {
    setArrayToolMode(null);
    setEditingArrayGroupId(null);
  }

  function startLinearArray() {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("linear");
  }

  function startCircularArray() {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("circular");
  }

  function editArrayGroupById(groupId: string) {
    const group = document.groups.find((item) => item.id === groupId);
    if (!group?.array) return;

    const sourceIds = group.array.sourceShapeIds.filter((id) =>
      document.shapes.some((shape) => shape.id === id),
    );
    if (sourceIds.length === 0) return;

    onSelectionChange({ ids: sourceIds, primaryId: sourceIds[0] ?? null });
    setEditingArrayGroupId(groupId);

    if (group.array.type === "linear") {
      setLinearArrayParams(group.array.params as any);
      setArrayToolMode("linear");
    } else {
      setCircularArrayParams(group.array.params as any);
      setArrayToolMode("circular");
    }
  }

  function applyArray() {
    if (selection.ids.length === 0 || !arrayToolMode) return;
    checkpointHistory();

    if (editingArrayGroupId) {
      const group = document.groups.find((item) => item.id === editingArrayGroupId);
      if (!group?.array) {
        setEditingArrayGroupId(null);
        setArrayToolMode(null);
        return;
      }

      const nextDefinition: any =
        arrayToolMode === "linear"
          ? {
              type: "linear",
              sourceShapeIds: group.array.sourceShapeIds,
              params: linearArrayParams,
            }
          : {
              type: "circular",
              sourceShapeIds: group.array.sourceShapeIds,
              params: circularArrayParams,
            };

      setDocument(updateGeometry(rebuildArrayGroup(document, editingArrayGroupId, nextDefinition)));
      setEditingArrayGroupId(null);
      setArrayToolMode(null);
      return;
    }

    const result =
      arrayToolMode === "linear"
        ? applyLinearArray(document, selection, linearArrayParams as any)
        : applyCircularArray(document, selection, circularArrayParams as any);

    setDocument(updateGeometry(result.document));
    setEditingArrayGroupId(null);
    setArrayToolMode(null);
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
      if (
        target?.tagName?.toLowerCase() === "input" ||
        target?.tagName?.toLowerCase() === "textarea" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (tool !== "polyline" && tool !== "bspline") return;

      if (event.key === "Enter" && polylineDraft.length >= 2) {
        event.preventDefault();
        if (tool === "polyline") commitPolyline();
        else commitBSpline();
      }

      if (event.key === "Escape" && polylineDraft.length > 0) {
        event.preventDefault();
        setPolylineDraft([]);
        setPolylineHoverPoint(null);
        setIsSelectionHover(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [polylineDraft, tool]);

  function startPan(
    event: React.PointerEvent<SVGElement | SVGSVGElement>,
    options?: { clearSelectionOnPointerUp?: boolean },
  ) {
    event.preventDefault();
    setIsSelectionHover(false);
    checkpointHistory();

    setPanState({
      pointerId: event.pointerId,
      button: event.button,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: view.offsetX,
      startOffsetY: view.offsetY,
      clearSelectionOnPointerUp: options?.clearSelectionOnPointerUp ?? false,
      moved: false,
    });
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
        x: payload.x,
        y: payload.y,
        contours: payload.contours.map((c) => c.map((p) => `${p.x},${p.y}`)),
        sourceWidth: payload.sourceWidth,
        sourceHeight: payload.sourceHeight,
        width: payload.width,
        height: payload.height,
        preserveAspectRatio: true,
      });

      checkpointHistory();
      setDocument(addShape(document, shape));
      focusCreatedShape(shape.id);
    },
  });

  function getCadPoint(event: React.PointerEvent<SVGElement>) {
    if (!svgRef.current) return null;
    return screenToCadPoint(
      event.clientX,
      event.clientY,
      svgRef.current.getBoundingClientRect(),
      document.height,
      view,
    );
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 2 && (draft || polylineDraft.length > 0)) {
      event.preventDefault();
      cancelCurrentDraft();
      return;
    }

    if (isPanMouseButton(event.button)) {
      startPan(event, {
        clearSelectionOnPointerUp:
          tool === "select" && event.button === 2 && selection.ids.length > 0,
      });
      return;
    }

    if (event.button !== 0) return;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? applyDefaultSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
        })
      : rawCad;

    if (tool === "rectangle") {
      setDraft(startRectangleDraft(cad.x, cad.y));
      return;
    }

    if (tool === "circle") {
      setDraft(startCircleDraft(cad.x, cad.y));
      return;
    }

    if (tool === "line") {
      setDraft(startLineDraft(cad.x, cad.y));
      return;
    }

    if (tool === "ellipse") {
      setDraft({ type: "line", startX: cad.x, startY: cad.y, endX: cad.x, endY: cad.y });
      return;
    }

    if (tool === "arc") {
      if (!draft) {
        setDraft(startArcRadiusDraft(cad.x, cad.y));
        return;
      }

      if (draft.type === "arc" && draft.stage === "radius") {
        if (
          distance(
            { x: draft.centerX, y: draft.centerY },
            { x: cad.x, y: cad.y },
          ) < 0.5
        ) {
          return;
        }

        setDraft({
          type: "arc",
          stage: "sweep",
          centerX: draft.centerX,
          centerY: draft.centerY,
          startX: cad.x,
          startY: cad.y,
          endX: cad.x,
          endY: cad.y,
          clockwise: false,
        });
        return;
      }

      if (draft.type === "arc" && draft.stage === "sweep") {
        const committed = getArcFromDraft({ ...draft, endX: cad.x, endY: cad.y });
        if (committed) {
          checkpointHistory();
          addArc(
            committed.cx,
            committed.cy,
            committed.radius,
            committed.startAngle,
            committed.endAngle,
            committed.clockwise,
          );
        }
        setDraft(null);
        return;
      }
    }

    if (tool === "polyline" || tool === "bspline") {
      setPolylineDraft((prev) => {
        const last = prev[prev.length - 1];
        if (isSamePoint(last, cad)) return prev;
        return [...prev, cad];
      });
      setPolylineHoverPoint(cad);
      return;
    }

    if (tool === "text") {
      checkpointHistory();
      addText(cad.x, cad.y);
      return;
    }

    if (tool === "trim") {
      const hit = hitTestShapes(cad, document.shapes, document.points);
      if (hit) {
        checkpointHistory();
        setDocument((prev) => ({
          ...prev,
          shapes: prev.shapes.filter((s) => s.id !== hit.id),
          constraints: prev.constraints.filter((c) => !c.shapeIds.includes(hit.id)),
        }));
      }
      return;
    }

    if (tool === "select") {
      onSelectionChangeSilently(clearSelection());
    }
  }

  function handleCanvasPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (panState && panState.pointerId === event.pointerId) {
      const moved =
        Math.abs(event.clientX - panState.startClientX) > 2 ||
        Math.abs(event.clientY - panState.startClientY) > 2;

      if (moved && !panState.moved) {
        setPanState((prev) => (prev ? { ...prev, moved: true } : prev));
      }

      onViewChangeSilently((prev) => ({
        ...prev,
        offsetX: panState.startOffsetX + (event.clientX - panState.startClientX),
        offsetY: panState.startOffsetY + (event.clientY - panState.startClientY),
      }));
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? applyDefaultSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
        })
      : rawCad;

    if (tool === "polyline" || tool === "bspline") {
      setPolylineHoverPoint(cad);
    }

    if (draft) {
      setDraft((prev) => updateDraft(prev as any, cad.x, cad.y));
      return;
    }

    if (dragState) {
      const next = updateDrag(dragState, cad.x, cad.y);
      if (!next) return;

      if (dragState.shapeId.startsWith("point:")) {
        const activePointId = dragState.shapeId.split(":")[1];

        const pointIds = new Set(
          dragState.selectionIds.length > 0
            ? dragState.selectionIds.filter((id) => isPointSelectionId(id))
            : [activePointId]
        );

        setDocumentSilently((prev) => movePointsAndSolve(prev, pointIds, next.dx, next.dy));
        setDragState(next.next);
        return;
      }

      const selectedIds =
        dragState.selectionIds.length > 0
          ? dragState.selectionIds
          : [dragState.shapeId];

      const affectedPointIds = new Set<string>();
      const nonParametricShapeIds = new Set<string>();

      selectedIds.forEach((id) => {
        if (isPointSelectionId(id)) {
          affectedPointIds.add(id);
        } else {
          const s = document.shapes.find((shape) => shape.id === id);
          if (!s) return;

          if (s.type === "text" || s.type === "svg") {
            nonParametricShapeIds.add(s.id);
          } else {
            const shape = s as any;
            if ("p1" in shape) affectedPointIds.add(shape.p1);
            if ("p2" in shape) affectedPointIds.add(shape.p2);
            if ("center" in shape) affectedPointIds.add(shape.center);
            if ("pointIds" in shape) shape.pointIds.forEach((pid: string) => affectedPointIds.add(pid));
            if ("controlPointIds" in shape) shape.controlPointIds.forEach((pid: string) => affectedPointIds.add(pid));
            if ("majorAxisPoint" in shape) affectedPointIds.add(shape.majorAxisPoint);
          }
        }
      });

      setDocumentSilently((prev) => {
        let nextDoc = movePointsAndSolve(prev, affectedPointIds, next.dx, next.dy);

        if (nonParametricShapeIds.size > 0) {
          nextDoc = {
            ...nextDoc,
            shapes: nextDoc.shapes.map((s) => {
              if (nonParametricShapeIds.has(s.id)) {
                return { ...s, x: (s as any).x + next.dx, y: (s as any).y + next.dy } as any;
              }
              return s;
            }),
          };
        }

        return nextDoc;
      });

      setDragState(next.next);
    }
  }

  function handleCanvasPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (draft?.type === "rectangle") {
      addRectangle(draft.startX, draft.startY, draft.endX, draft.endY);
      setDraft(null);
    } else if (draft?.type === "circle") {
      const circle = getCircleFromDraft(draft);
      addCircle(circle.cx, circle.cy, circle.radius);
      setDraft(null);
    } else if (draft?.type === "line") {
      if (tool === "ellipse") {
        addEllipse(draft.startX, draft.startY, draft.endX, draft.endY);
      } else {
        const line = getLineFromDraft(draft);
        addLine(line.x1, line.y1, line.x2, line.y2);
      }
      setDraft(null);
    }

    if (panState && panState.pointerId === event.pointerId) {
      if (
        panState.clearSelectionOnPointerUp &&
        !panState.moved &&
        tool === "select"
      ) {
        onSelectionChangeSilently(clearSelection());
      }
      setPanState(null);
    }

    setDragState(finishDrag());
  }

  function addRectangle(x1: number, y1: number, x2: number, y2: number) {
    if (Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5) return;

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const p1 = createPoint(minX, minY);
    const p2 = createPoint(maxX, minY);
    const p3 = createPoint(maxX, maxY);
    const p4 = createPoint(minX, maxY);

    const groupId = createId("group");
    const rectIndex =
      document.groups.filter((g) => g.name.startsWith("Rectangle")).length + 1;

    const l1 = { ...createLineShape(`Rectangle ${rectIndex} - Bottom`, p1.id, p2.id), groupId };
    const l2 = { ...createLineShape(`Rectangle ${rectIndex} - Right`, p2.id, p3.id), groupId };
    const l3 = { ...createLineShape(`Rectangle ${rectIndex} - Top`, p3.id, p4.id), groupId };
    const l4 = { ...createLineShape(`Rectangle ${rectIndex} - Left`, p4.id, p1.id), groupId };

    const nextConstraints = [
      createConstraint("horizontal", [p1.id, p2.id], [l1.id]),
      createConstraint("vertical", [p2.id, p3.id], [l2.id]),
      createConstraint("horizontal", [p3.id, p4.id], [l3.id]),
      createConstraint("vertical", [p4.id, p1.id], [l4.id]),
    ];

    checkpointHistory();

    const nextDoc = updateGeometry({
      ...document,
      points: [...document.points, p1, p2, p3, p4],
      shapes: [...document.shapes, l1, l2, l3, l4],
      groups: [
        ...document.groups,
        {
          id: groupId,
          name: `Rectangle ${rectIndex}`,
          collapsed: false,
        },
      ],
      constraints: [...document.constraints, ...nextConstraints],
    });

    setDocument(nextDoc);

    setToolState("select");
    onSelectionChange({
      ids: [l1.id, l2.id, l3.id, l4.id],
      primaryId: l1.id,
    });

    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setIsSelectionHover(false);
  }

  function addCircle(cx: number, cy: number, radius: number) {
    if (radius < 1) return;

    const center = createPoint(cx, cy);
    const nextDoc = addPoint(document, center);
    const shape = createCircleShape(
      `Circle ${document.shapes.filter((s) => s.type === "circle").length + 1}`,
      center.id,
      radius,
    );

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function addLine(x1: number, y1: number, x2: number, y2: number) {
    if (distance({ x: x1, y: y1 }, { x: x2, y: y2 }) < 0.5) return;

    const p1 = createPoint(x1, y1);
    const p2 = createPoint(x2, y2);
    let nextDoc = addPoint(document, p1);
    nextDoc = addPoint(nextDoc, p2);

    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);

    if (dy < dx * 0.05) {
      nextDoc.constraints.push(createConstraint("horizontal", [p1.id, p2.id], [], 0));
    } else if (dx < dy * 0.05) {
      nextDoc.constraints.push(createConstraint("vertical", [p1.id, p2.id], [], 0));
    }

    const shape = createLineShape(
      `Line ${document.shapes.filter((s) => s.type === "line").length + 1}`,
      p1.id,
      p2.id,
    );

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function addArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    clockwise = false,
  ) {
    if (radius < 1) return;

    const center = createPoint(cx, cy);
    const p1 = createPoint(
      cx + radius * Math.cos((startAngle * Math.PI) / 180),
      cy + radius * Math.sin((startAngle * Math.PI) / 180),
    );
    const p2 = createPoint(
      cx + radius * Math.cos((endAngle * Math.PI) / 180),
      cy + radius * Math.sin((endAngle * Math.PI) / 180),
    );

    let nextDoc = addPoint(document, center);
    nextDoc = addPoint(nextDoc, p1);
    nextDoc = addPoint(nextDoc, p2);

    const shape = createArcShape({
      name: `Arc ${document.shapes.filter((s) => s.type === "arc").length + 1}`,
      center: center.id,
      p1: p1.id,
      p2: p2.id,
      clockwise,
      radius,
    });

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }

  function addEllipse(cx: number, cy: number, mx: number, my: number) {
    const center = createPoint(cx, cy);
    const major = createPoint(mx, my);
    const dist = distance(center, major);
    if (dist < 1) return;

    let nextDoc = addPoint(document, center);
    nextDoc = addPoint(nextDoc, major);

    const shape = createEllipseShape(
      `Ellipse ${document.shapes.filter((s) => s.type === "ellipse").length + 1}`,
      center.id,
      major.id,
      dist * 0.6,
    );

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
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

    checkpointHistory();
    setDocument(addShape(document, shape));
    focusCreatedShape(shape.id);
  }

  function bindSelectStart(event: React.PointerEvent<SVGElement>, rawId: string) {
    if (tool !== "select") return;

    if (isPanMouseButton(event.button)) {
      event.stopPropagation();
      startPan(event);
      return;
    }

    event.stopPropagation();

    const id = rawId.startsWith("point:") ? rawId.slice(6) : rawId;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? applyDefaultSnap(rawCad, { points: document.points })
      : rawCad;

    const nextSelection = event.shiftKey
      ? toggleSelection(selection, id)
      : isSelected(selection, id)
        ? selection
        : selectOnly(id);

    if (nextSelection !== selection) {
      onSelectionChangeSilently(nextSelection);
    }

    if (event.button !== 0 || event.shiftKey) return;

    checkpointHistory();

    if (isPointSelectionId(id)) {
      setDragState({
        shapeId: "point:" + id,
        startX: cad.x,
        startY: cad.y,
        selectionIds: nextSelection.ids.filter((sid) => isPointSelectionId(sid)),
      });
    } else {
      setDragState(
        createDragState(
          id,
          cad.x,
          cad.y,
          getDragShapeIds(document, id, nextSelection),
        ),
      );
    }
  }

  function bindSelectionDragStart(event: React.PointerEvent<SVGRectElement>) {
    if (isPanMouseButton(event.button)) {
      startPan(event);
      return;
    }

    if (tool !== "select" || event.button !== 0 || !selection.primaryId) return;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? applyDefaultSnap(rawCad, { points: document.points })
      : rawCad;

    checkpointHistory();
    setDragState(
      createDragState(
        selection.primaryId,
        cad.x,
        cad.y,
        getDragShapeIds(document, selection.primaryId, selection),
      ),
    );
  }

  function cancelCurrentDraft() {
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setDragState(null);
    setIsSelectionHover(false);
  }

    function setSelectedBSplineDegree(nextDegree: number) {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;

    const maxDegree = Math.max(1, shape.controlPointIds.length - 1);
    const degree = Math.max(1, Math.min(maxDegree, Math.round(nextDegree || 1)));

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? { ...item, degree }
          : item,
      ),
    }));
  }

  function setSelectedBSplinePeriodic(periodic: boolean) {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? { ...item, periodic }
          : item,
      ),
    }));
  }

    function insertControlPointToSelectedBSpline(x: number, y: number) {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;

    const result = insertBSplineControlPoint(shape, document.points, { x, y });
    if (!result) return;

    checkpointHistory();

    setDocument((prev) => ({
      ...prev,
      points: [...prev.points, result.point],
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? {
              ...item,
              controlPointIds: result.nextControlPointIds,
              degree: Math.max(1, Math.min(item.degree, result.nextControlPointIds.length - 1)),
            }
          : item,
      ),
    }));
  }

  function removeSelectedPointFromBSpline() {
    if (!selection.primaryId) return;
    if (!selection.primaryId.startsWith("pt-")) return;

    const selectedPointId = selection.primaryId;
    const ownerSpline = document.shapes.find(
      (shape) =>
        shape.type === "bspline" &&
        shape.controlPointIds.includes(selectedPointId),
    );

    if (!ownerSpline || ownerSpline.type !== "bspline") return;

    const result = removeBSplineControlPoint(ownerSpline, selectedPointId);
    if (!result) return;

    checkpointHistory();

    setDocument((prev) => {
      const nextShapes = prev.shapes.map((shape) =>
        shape.id === ownerSpline.id
          ? {
              ...shape,
              controlPointIds: result.nextControlPointIds,
              degree: result.nextDegree,
            }
          : shape,
      );

      const stillUsedPointIds = new Set<string>();
      nextShapes.forEach((shape) => {
        const s = shape as any;
        if (s.p1) stillUsedPointIds.add(s.p1);
        if (s.p2) stillUsedPointIds.add(s.p2);
        if (s.center) stillUsedPointIds.add(s.center);
        if (s.pointIds) s.pointIds.forEach((id: string) => stillUsedPointIds.add(id));
        if (s.controlPointIds) s.controlPointIds.forEach((id: string) => stillUsedPointIds.add(id));
        if (s.majorAxisPoint) stillUsedPointIds.add(s.majorAxisPoint);
      });

      return {
        ...prev,
        shapes: nextShapes,
        points: prev.points.filter((p) => p.id !== selectedPointId || stillUsedPointIds.has(p.id)),
      };
    });

    onSelectionChangeSilently({
      ids: [ownerSpline.id],
      primaryId: ownerSpline.id,
    });
  }

  return {
    svgRef,
    tool,
    setTool,
    draft,
    polylineDraft,
    polylineHoverPoint,
    textTool,
    setTextTool,
    textPreviewMap,
    isGenerating,
    view,

    isDragging: !!dragState,
    isPanning: !!panState,
    isSelectionHover,
    setIsSelectionHover,
    isTransforming: false,

    setSelectedBSplineDegree,
    setSelectedBSplinePeriodic,

    insertControlPointToSelectedBSpline,
    removeSelectedPointFromBSpline,

    dof,
    solveState: diagnostics.solveState,
    constraintIssues: diagnostics.issues,
    conflictingConstraintIds: diagnostics.conflictingConstraintIds,

    resetView: () => {
      onViewChange({ scale: 1, offsetX: 0, offsetY: 0 });
      setIsSelectionHover(false);
    },

    commitPolyline,
    cancelCurrentDraft,

    cloneSelected: () => {
      checkpointHistory();

      const selectedShapes = document.shapes.filter((s) => selection.ids.includes(s.id));
      if (selectedShapes.length === 0) return;

      const pointMap = new Map<string, string>();
      const clonedPoints: any[] = [];
      const clonedShapes: any[] = [];
      const clonedConstraints: any[] = [];

      selectedShapes.forEach((s) => {
        const shape = s as any;
        const pids: string[] = [];
        if (shape.p1) pids.push(shape.p1);
        if (shape.p2) pids.push(shape.p2);
        if (shape.center) pids.push(shape.center);
        if (shape.pointIds) pids.push(...shape.pointIds);
        if (shape.controlPointIds) pids.push(...shape.controlPointIds);
        if (shape.majorAxisPoint) pids.push(shape.majorAxisPoint);

        pids.forEach((pid) => {
          if (!pointMap.has(pid)) {
            const original = document.points.find((p) => p.id === pid);
            if (original) {
              const cp = createPoint(original.x + 10, original.y + 10);
              pointMap.set(pid, cp.id);
              clonedPoints.push(cp);
            }
          }
        });
      });

      selectedShapes.forEach((s) => {
        const cloned = { ...s, id: createId(s.type) };
        const cs = cloned as any;
        if (cs.p1) cs.p1 = pointMap.get(cs.p1);
        if (cs.p2) cs.p2 = pointMap.get(cs.p2);
        if (cs.center) cs.center = pointMap.get(cs.center);
        if (cs.pointIds) cs.pointIds = cs.pointIds.map((pid: string) => pointMap.get(pid));
        if (cs.controlPointIds) cs.controlPointIds = cs.controlPointIds.map((pid: string) => pointMap.get(pid));
        if (cs.majorAxisPoint) cs.majorAxisPoint = pointMap.get(cs.majorAxisPoint);
        clonedShapes.push(cloned);
      });

      document.constraints.forEach((c) => {
        if (c.pointIds.every((pid) => pointMap.has(pid))) {
          clonedConstraints.push({
            ...c,
            id: createId("const"),
            pointIds: c.pointIds.map((pid) => pointMap.get(pid)!),
            shapeIds: clonedShapes.map((s) => s.id),
          });
        }
      });

      const nextDoc = {
        ...document,
        points: [...document.points, ...clonedPoints],
        shapes: [...document.shapes, ...clonedShapes],
        constraints: [...document.constraints, ...clonedConstraints],
      };

      setDocument(nextDoc);
      onSelectionChange({
        ids: clonedShapes.map((s) => s.id),
        primaryId: clonedShapes[0]?.id || null,
      });
    },

    mirrorSelected: (axis: MirrorAxis) => {
      checkpointHistory();

      const selectedShapes = document.shapes.filter((s) => selection.ids.includes(s.id));
      if (selectedShapes.length === 0) return;

      const affectedPointIds = new Set<string>();
      selectedShapes.forEach((s) => {
        const shape = s as any;
        if (shape.p1) affectedPointIds.add(shape.p1);
        if (shape.p2) affectedPointIds.add(shape.p2);
        if (shape.center) affectedPointIds.add(shape.center);
        if (shape.pointIds) shape.pointIds.forEach((pid: string) => affectedPointIds.add(pid));
        if (shape.controlPointIds) shape.controlPointIds.forEach((pid: string) => affectedPointIds.add(pid));
        if (shape.majorAxisPoint) affectedPointIds.add(shape.majorAxisPoint);
      });

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      affectedPointIds.forEach((pid) => {
        const p = document.points.find((pt) => pt.id === pid);
        if (p) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
      });

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      setDocument((prev) => ({
        ...prev,
        points: prev.points.map((p) => {
          if (affectedPointIds.has(p.id)) {
            if (axis === "x") return { ...p, y: cy - (p.y - cy) };
            if (axis === "y") return { ...p, x: cx - (p.x - cx) };
          }
          return p;
        }),
      }));
    },

    deleteSelected: () => {
      checkpointHistory();

      const selectedItemIds = new Set(selection.ids);

      const remainingShapes = document.shapes.filter((s) => !selectedItemIds.has(s.id));
      const remainingPoints = document.points.filter((p) => !selectedItemIds.has(p.id));

      const usedPointIds = new Set<string>();
      remainingShapes.forEach((s) => {
        const shape = s as any;
        if (shape.p1) usedPointIds.add(shape.p1);
        if (shape.p2) usedPointIds.add(shape.p2);
        if (shape.center) usedPointIds.add(shape.center);
        if (shape.pointIds) shape.pointIds.forEach((pid: string) => usedPointIds.add(pid));
        if (shape.controlPointIds) shape.controlPointIds.forEach((pid: string) => usedPointIds.add(pid));
        if (shape.majorAxisPoint) usedPointIds.add(shape.majorAxisPoint);
      });

      const nextPoints = remainingPoints.filter((p) => usedPointIds.has(p.id));
      const nextConstraints = document.constraints.filter(
        (c) =>
          c.pointIds.every((pid) => usedPointIds.has(pid)) &&
          !c.shapeIds.some((sid) => selectedItemIds.has(sid)),
      );

      const nextDocument = {
        ...document,
        points: nextPoints,
        shapes: remainingShapes,
        constraints: nextConstraints,
      };

      setDocument(nextDocument);
      onSelectionChange(normalizeSelectionAfterDelete(nextDocument, clearSelection()));
    },

    deleteShape: (id: string) =>
      setDocument((d) => {
        const remainingShapes = d.shapes.filter((s) => s.id !== id);
        const usedPointIds = new Set<string>();

        remainingShapes.forEach((s) => {
          const shape = s as any;
          if (shape.p1) usedPointIds.add(shape.p1);
          if (shape.p2) usedPointIds.add(shape.p2);
          if (shape.center) usedPointIds.add(shape.center);
          if (shape.pointIds) shape.pointIds.forEach((pid: string) => usedPointIds.add(pid));
          if (shape.controlPointIds) shape.controlPointIds.forEach((pid: string) => usedPointIds.add(pid));
          if (shape.majorAxisPoint) usedPointIds.add(shape.majorAxisPoint);
        });

        return {
          ...d,
          shapes: remainingShapes,
          points: d.points.filter((p) => usedPointIds.has(p.id)),
          constraints: d.constraints.filter((c) => !c.shapeIds.includes(id)),
        };
      }),

    renameShape: (id: string, name: string) =>
      setDocument((d) => ({
        ...d,
        shapes: d.shapes.map((s) => (s.id === id ? { ...s, name } : s)),
      })),

    toggleShapeVisibility: (id: string) =>
      setDocument((d) => ({
        ...d,
        shapes: d.shapes.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
      })),

    groupSelected: () => setDocument((d) => groupSelectedShapes(d, selection)),
    ungroupSelected: () => setDocument((d) => ungroupSelectedShapes(d, selection)),

    handleGenerateClick: async () => {
      setIsGenerating(true);
      try {
        const gcode = await generateSketchGCode(document);
        onGenerateGCode(gcode);
      } finally {
        setIsGenerating(false);
      }
    },

    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasPointerLeave: () => {
      setDragState(finishDrag());
      setPanState(null);
    },
    handleCanvasContextMenu: (e: any) => e.preventDefault(),

    handleCanvasDoubleClick: (e: any) => {
      if (tool === "polyline" || tool === "bspline") {
        e.preventDefault();
        if (tool === "polyline") commitPolyline();
        else commitBSpline();
      }
    },

    handleCanvasWheel: (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      const direction = event.deltaY < 0 ? 1 : -1;

      onViewChange((prev) => {
        const nextScale = clamp(prev.scale * (1 + direction * 0.06), 0.25, 20);
        const ratio = nextScale / prev.scale;

        return {
          scale: nextScale,
          offsetX: anchorX - (anchorX - prev.offsetX) * ratio,
          offsetY: anchorY - (anchorY - prev.offsetY) * ratio,
        };
      });
    },

    bindSelectStart,

    bindSelectionDragStart,

    bindScaleHandleStart: (_e: any, _handle: any) => {
      if (selection.primaryId) {
        const shape = document.shapes.find((s) => s.id === selection.primaryId);
        if (shape?.type === "text" || shape?.type === "svg") {
          // TODO: Implement direct scaling for text/svg
        }
      }
    },

    bindRotateHandleStart: (_e: any) => {
      if (selection.primaryId) {
        const shape = document.shapes.find((s) => s.id === selection.primaryId);
        if (shape?.type === "text" || shape?.type === "svg") {
          // TODO: Implement direct rotation for text/svg
        }
      }
    },

    bindConstraintEdgeHandleStart: () => {},
    bindConstraintLabelDragStart: () => {},
    fontOptions: DEFAULT_FONT_OPTIONS,

    toggleConstruction: () => {
      if (selection.ids.length === 0) return;
      checkpointHistory();

      setDocument((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) =>
          selection.ids.includes(s.id)
            ? { ...s, isConstruction: !s.isConstruction }
            : s,
        ),
      }));
    },

    svgImport,
    startSvgImport,
    closeSvgImport,
    abortSvgImport,
    updateSvgImportDraft,
    confirmSvgImport,

    renameGroup: (id: string, name: string) =>
      setDocument((d) => renameGroup(d, id, name)),

    toggleGroupCollapsed: (id: string) =>
      setDocument((d) => toggleGroupCollapsed(d, id)),

    reorderDocumentShapes: (ids: string[]) =>
      setDocument((d) => reorderShapes(d, ids)),

    startLinearArray,
    startCircularArray,
    applyArray,
    closeArrayTool,

    updateLinearArrayParams: (p: any) =>
      setLinearArrayParams((prev) => ({ ...prev, ...p })),

    updateCircularArrayParams: (p: any) =>
      setCircularArrayParams((prev) => ({ ...prev, ...p })),

    editArrayGroupById,

    arrayTool: {
      mode: arrayToolMode,
      linear: linearArrayParams,
      circular: circularArrayParams,
      editingGroupId: editingArrayGroupId,
    },

    arrayPreviewShapes: (() => {
      if (!arrayToolMode || selection.ids.length === 0) return [];

      const groupId = "preview-array";
      const definition: any =
        arrayToolMode === "linear"
          ? {
              type: "linear",
              sourceShapeIds: selection.ids,
              params: linearArrayParams,
            }
          : {
              type: "circular",
              sourceShapeIds: selection.ids,
              params: circularArrayParams,
            };

      const previewDoc = rebuildArrayGroup(
        { ...document, shapes: [...document.shapes] },
        groupId,
        definition,
      );

      return previewDoc.shapes.filter((s) => s.groupId === groupId);
    })(),

    addQuickConstraint: (type: any) => {
      checkpointHistory();

      let pids: string[] = [];
      const selectedShapes = document.shapes.filter((s) => selection.ids.includes(s.id));

      selectedShapes.forEach((s) => {
        const shape = s as any;

        if (s.type === "line" || s.type === "rectangle" || s.type === "arc") {
          if (shape.p1) pids.push(shape.p1);
          if (shape.p2) pids.push(shape.p2);
          if (shape.center) pids.push(shape.center);
        } else if (s.type === "circle") {
          if (shape.center) pids.push(shape.center);
        } else if (s.type === "polyline" || s.type === "bspline") {
          if (shape.pointIds) pids.push(...shape.pointIds);
          if (shape.controlPointIds) pids.push(...shape.controlPointIds);
        }
      });

      let finalPids = pids;

      if (type === "parallel" || type === "perpendicular") {
        const lines = selectedShapes.filter((s) => s.type === "line");
        if (lines.length >= 2) {
          finalPids = [
            (lines[0] as any).p1,
            (lines[0] as any).p2,
            (lines[1] as any).p1,
            (lines[1] as any).p2,
          ];
        } else {
          console.warn(`${type} constraint requires 2 lines`);
          return;
        }
      } else if (type === "coincident" || type === "distance") {
        finalPids = pids.slice(0, 2);
      } else {
        finalPids = pids.slice(0, 2);
      }

      if (type === "lock") {
        checkpointHistory();
        setDocument((prev) => ({
          ...prev,
          points: prev.points.map((p) =>
            finalPids.includes(p.id) ? { ...p, isFixed: true } : p,
          ),
        }));
        return;
      }

      const constraint = createConstraint(
        type,
        finalPids,
        selection.ids,
        ["distance", "angle", "radius", "diameter"].includes(type) ? 50 : undefined,
      );

      setDocument(updateGeometry(addConstraint(document, constraint)));
    },

    onConstraintPointerDown: (e: any, id: string) => {
      e.stopPropagation();

      if (id.startsWith("point:")) {
        const pointId = id.split(":")[1];
        bindSelectStart(e, pointId);
        return;
      }

      const constraint = document.constraints.find((c) => c.id === id);
      if (
        !constraint ||
        !["distance", "distance-x", "distance-y", "radius", "diameter", "angle"].includes(constraint.type)
      ) {
        return;
      }

      const newValStr = window.prompt(
        `Enter new value for ${constraint.type} constraint:`,
        String(constraint.value || 0),
      );
      if (newValStr === null) return;

      if (newValStr.trim().toLowerCase() === "delete") {
        checkpointHistory();
        setDocument((prev) => ({
          ...prev,
          constraints: prev.constraints.filter((c) => c.id !== id),
        }));
        return;
      }

      const newVal = parseFloat(newValStr);
      if (isNaN(newVal)) return;

      checkpointHistory();
      setDocument((prev) => {
        const nextConstraints = prev.constraints.map((c) =>
          c.id === id ? { ...c, value: newVal } : c,
        );
        return updateGeometry({ ...prev, constraints: nextConstraints });
      });
    },
  };
}
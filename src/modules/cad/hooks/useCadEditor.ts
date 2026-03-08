import { useEffect, useRef, useState, useMemo } from "react";
import {
  appendPolylinePoint,
  finishDrag,
  startArcRadiusDraft,
  startCircleDraft,
  startDrag,
  startLineDraft,
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
  getArcFromDraft,
  getCircleFromDraft,
  getLineFromDraft,
  getRectangleFromDraft,
} from "../geometry/draftGeometry";
import { addShape } from "../model/document";
import {
  cloneShape,
  createArcShape,
  createCircleShape,
  createLineShape,
  createPolylineShape,
  createRectangleShape,
  createSvgShape,
  createTextShape,
} from "../model/shapeFactory";
import { mirrorShape, moveShape, rotateShape, scaleShape } from "../model/shapeTransforms";
import type {
  ConstraintEdge,
  MirrorAxis,
  SketchDocument,
  SketchPolylinePoint,
  SketchShape,
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
import { selectionBounds, groupBounds, shapeBounds, type Bounds2D } from "../model/shapeBounds";
import type { CadPanButtonMode } from "../../../utils/settings";
import {
  edgeAxis,
  getDistanceBetweenEdges,
  getSheetBounds,
  updateConstraint,
  upsertConstraintForEdge,
} from "../model/constraints";
import { distance } from "../geometry/distance";
import { createId } from "../model/ids";
import {
  applyCircularArray,
  applyLinearArray,
  rebuildArrayGroup,
  type CircularArrayParams,
  type LinearArrayParams,
} from "../model/array";

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

type ScaleHandle = "nw" | "ne" | "sw" | "se";

type TransformSnapshot = {
  [shapeId: string]: SketchShape;
};

type ScaleTransformState = {
  kind: "scale";
  pointerId: number;
  selectionIds: string[];
  origin: SketchPolylinePoint;
  startDistance: number;
  initialShapes: TransformSnapshot;
};

type RotateTransformState = {
  kind: "rotate";
  pointerId: number;
  selectionIds: string[];
  center: SketchPolylinePoint;
  startAngle: number;
  initialShapes: TransformSnapshot;
};

type TransformState = ScaleTransformState | RotateTransformState | null;

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

type ConstraintCreateState = {
  pointerId: number;
  shapeId: string;
  edge: ConstraintEdge;
  pointer: SketchPolylinePoint;
  hoverTarget: ConstraintDraftTarget | null;
} | null;

type ConstraintLabelDragState = {
  pointerId: number;
  constraintId: string;
  axis: "x" | "y";
  sign: 1 | -1;
  startPoint: SketchPolylinePoint;
  initialDistance: number;
} | null;

type ArrayToolMode = "linear" | "circular" | null;

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function angleBetween(center: SketchPolylinePoint, point: SketchPolylinePoint): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

function isSamePoint(
  a: SketchPolylinePoint | null | undefined,
  b: SketchPolylinePoint | null | undefined,
  epsilon = 0.001,
): boolean {
  if (!a || !b) return false;
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

function getSelectionShapeIds(
  document: SketchDocument,
  selection: SelectionState,
): string[] {
  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  if (primary?.groupId) {
    return document.shapes
      .filter((shape) => shape.groupId === primary.groupId)
      .map((shape) => shape.id);
  }

  return selection.ids;
}

function buildShapeSnapshot(document: SketchDocument, ids: string[]): TransformSnapshot {
  const snapshot: TransformSnapshot = {};

  document.shapes.forEach((shape) => {
    if (ids.includes(shape.id)) {
      snapshot[shape.id] = shape;
    }
  });

  return snapshot;
}

function getSelectionBox(
  document: SketchDocument,
  selection: SelectionState,
) {
  const primary = document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  if (primary?.groupId) {
    return groupBounds(document, primary.groupId);
  }

  return selectionBounds(document.shapes.filter((shape) => selection.ids.includes(shape.id)));
}

function getScaleOrigin(bounds: {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}, handle: ScaleHandle): SketchPolylinePoint {
  switch (handle) {
    case "nw":
      return { x: bounds.maxX, y: bounds.minY };
    case "ne":
      return { x: bounds.minX, y: bounds.minY };
    case "sw":
      return { x: bounds.maxX, y: bounds.maxY };
    case "se":
      return { x: bounds.minX, y: bounds.maxY };
  }
}

function getScaleHandlePoint(bounds: {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}, handle: ScaleHandle): SketchPolylinePoint {
  switch (handle) {
    case "nw":
      return { x: bounds.minX, y: bounds.maxY };
    case "ne":
      return { x: bounds.maxX, y: bounds.maxY };
    case "sw":
      return { x: bounds.minX, y: bounds.minY };
    case "se":
      return { x: bounds.maxX, y: bounds.minY };
  }
}

function edgeDistanceToPoint(
  point: SketchPolylinePoint,
  bounds: Bounds2D,
  edge: ConstraintEdge,
): number {
  switch (edge) {
    case "left":
      return Math.abs(point.x - bounds.minX);
    case "right":
      return Math.abs(point.x - bounds.maxX);
    case "bottom":
      return Math.abs(point.y - bounds.minY);
    case "top":
      return Math.abs(point.y - bounds.maxY);
  }
}

function getCompatibleEdges(axis: "x" | "y"): ConstraintEdge[] {
  return axis === "x" ? ["left", "right"] : ["bottom", "top"];
}

function getDefaultCircularRadius(
  document: SketchDocument,
  selection: SelectionState,
  center: { x: number; y: number },
): number {
  const bounds = getSelectionBox(document, selection);
  const sourceCenter = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };

  return Math.max(
    0,
    distance(sourceCenter, center),
  );
}

function getDefaultCircularCenter(
  document: SketchDocument,
  selection: SelectionState,
): { x: number; y: number } {
  const bounds = getSelectionBox(document, selection);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
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
  const [transformState, setTransformState] = useState<TransformState>(null);
  const [isSelectionHover, setIsSelectionHover] = useState(false);
  const [constraintCreateState, setConstraintCreateState] =
    useState<ConstraintCreateState>(null);
  const [constraintLabelDragState, setConstraintLabelDragState] =
    useState<ConstraintLabelDragState>(null);

  const [arrayToolMode, setArrayToolMode] = useState<ArrayToolMode>(null);
  const [editingArrayGroupId, setEditingArrayGroupId] = useState<string | null>(null);

  const [linearArrayParams, setLinearArrayParams] = useState<LinearArrayParams>({
    count: 3,
    spacing: 20,
    axis: "x",
    direction: "positive",
  });

  const [circularArrayParams, setCircularArrayParams] = useState<CircularArrayParams>({
    count: 6,
    centerX: 0,
    centerY: 0,
    radius: 30,
    totalAngle: 360,
    rotateItems: true,
  });

  const textPreviewMap = useTextPreviewMap(document.shapes);

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

    const center = getDefaultCircularCenter(document, selection);
    const radius = getDefaultCircularRadius(document, selection, center);

    setCircularArrayParams((prev) => ({
      ...prev,
      centerX: center.x,
      centerY: center.y,
      radius,
    }));
    setEditingArrayGroupId(null);
    setArrayToolMode("circular");
  }

  function updateLinearArrayParams(patch: Partial<LinearArrayParams>) {
    setLinearArrayParams((prev) => ({ ...prev, ...patch }));
  }

  function updateCircularArrayParams(patch: Partial<CircularArrayParams>) {
    setCircularArrayParams((prev) => ({ ...prev, ...patch }));
  }

  function editArrayGroupById(groupId: string) {
    const group = document.groups.find((item) => item.id === groupId);
    if (!group?.array) return;

    const sourceIds = group.array.sourceShapeIds.filter((id) =>
      document.shapes.some((shape) => shape.id === id),
    );

    if (sourceIds.length === 0) return;

    onSelectionChange({
      ids: sourceIds,
      primaryId: sourceIds[0] ?? null,
    });

    setEditingArrayGroupId(groupId);

    if (group.array.type === "linear") {
      setLinearArrayParams(group.array.params);
      setArrayToolMode("linear");
      return;
    }

    setCircularArrayParams(group.array.params);
    setArrayToolMode("circular");
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

      const nextDefinition =
        arrayToolMode === "linear"
          ? {
              type: "linear" as const,
              sourceShapeIds: group.array.sourceShapeIds,
              params: linearArrayParams,
            }
          : {
              type: "circular" as const,
              sourceShapeIds: group.array.sourceShapeIds,
              params: circularArrayParams,
            };

      const result = rebuildArrayGroup(document, editingArrayGroupId, nextDefinition);
      setDocument(result.document);

      const nextSelectionIds = [
        ...nextDefinition.sourceShapeIds,
        ...result.createdShapeIds,
      ];

      onSelectionChange({
        ids: nextSelectionIds,
        primaryId: nextDefinition.sourceShapeIds[0] ?? result.createdShapeIds[0] ?? null,
      });

      setEditingArrayGroupId(null);
      setArrayToolMode(null);
      return;
    }

    if (arrayToolMode === "linear") {
      const result = applyLinearArray(document, selection, linearArrayParams);
      setDocument(result.document);

      const primaryShapeId =
        selection.primaryId &&
        result.document.shapes.some((shape) => shape.id === selection.primaryId)
          ? selection.primaryId
          : result.createdShapeIds[0] ?? null;

      onSelectionChange({
        ids: getSelectionShapeIds(result.document, {
          ids: selection.ids,
          primaryId: primaryShapeId,
        }),
        primaryId: primaryShapeId,
      });

      setEditingArrayGroupId(null);
      setArrayToolMode(null);
      return;
    }

    const result = applyCircularArray(document, selection, circularArrayParams);
    setDocument(result.document);

    const primaryShapeId =
      selection.primaryId &&
      result.document.shapes.some((shape) => shape.id === selection.primaryId)
        ? selection.primaryId
        : result.createdShapeIds[0] ?? null;

    onSelectionChange({
      ids: getSelectionShapeIds(result.document, {
        ids: selection.ids,
        primaryId: primaryShapeId,
      }),
      primaryId: primaryShapeId,
    });

    setEditingArrayGroupId(null);
    setArrayToolMode(null);
    
  }

  useEffect(() => {
    const handleEditArrayGroup = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId?: string }>;
      const groupId = customEvent.detail?.groupId;
      if (!groupId) return;
      editArrayGroupById(groupId);
    };

    window.addEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);

    return () => {
      window.removeEventListener(EDIT_ARRAY_GROUP_EVENT, handleEditArrayGroup);
    };
  }, [document, selection]);

  useEffect(() => {
    if (tool !== "polyline") {
      setPolylineHoverPoint(null);
    }
  }, [tool]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (tool !== "polyline") {
        return;
      }

      if (event.key === "Enter") {
        if (polylineDraft.length >= 2) {
          event.preventDefault();
          checkpointHistory();
          const shape = createPolylineShape(
            `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
            polylineDraft,
            false,
          );

          setDocument((prev) => addShape(prev, shape));
          focusCreatedShape(shape.id);
        }
        return;
      }

      if (event.key === "Escape") {
        if (polylineDraft.length > 0) {
          event.preventDefault();
          setPolylineDraft([]);
          setPolylineHoverPoint(null);
          setIsSelectionHover(false);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    checkpointHistory,
    document.shapes,
    onSelectionChange,
    polylineDraft,
    setDocument,
    tool,
  ]);

  function isPanMouseButton(button: number): boolean {
    if (panButtonMode === "middle") {
      return button === 1;
    }

    if (panButtonMode === "right") {
      return button === 2;
    }

    return button === 1 || button === 2;
  }

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
      focusCreatedShape(shape.id);
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
    setIsSelectionHover(false);
  }

  function cancelCurrentDraft() {
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setConstraintCreateState(null);
    setConstraintLabelDragState(null);
    setTransformState(null);
    setDragState(null);
    setIsSelectionHover(false);
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
    focusCreatedShape(shape.id);
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
    focusCreatedShape(shape.id);
  }

  function addLine(x1: number, y1: number, x2: number, y2: number) {
    if (distance({ x: x1, y: y1 }, { x: x2, y: y2 }) < 0.5) return;

    const shape = createLineShape(
      `Line ${document.shapes.filter((s) => s.type === "line").length + 1}`,
      x1,
      y1,
      x2,
      y2,
    );

    setDocument((prev) => addShape(prev, shape));
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

    const shape = createArcShape({
      name: `Arc ${document.shapes.filter((s) => s.type === "arc").length + 1}`,
      cx,
      cy,
      radius,
      startAngle,
      endAngle,
      clockwise,
    });

    setDocument((prev) => addShape(prev, shape));
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

    setDocument((prev) => addShape(prev, shape));
    focusCreatedShape(shape.id);
  }

  function commitPolyline() {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    const shape = createPolylineShape(
      `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      polylineDraft,
      false,
    );

    setDocument((prev) => addShape(prev, shape));
    focusCreatedShape(shape.id);
  }

  function cloneSelected() {
    const selectedIds = getSelectionShapeIds(document, selection);
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);
    const groupIds = Array.from(
      new Set(
        document.shapes
          .filter((shape) => selectedSet.has(shape.id))
          .map((shape) => shape.groupId)
          .filter(Boolean),
      ),
    ) as string[];

    const groupMap = new Map<string, string>();
    groupIds.forEach((groupId) => groupMap.set(groupId, createId("group")));

    const newGroups = document.groups
      .filter((group) => groupMap.has(group.id))
      .map((group) => ({
        ...group,
        id: groupMap.get(group.id)!,
        name: `${group.name} копия`,
      }));

    const clones = document.shapes
      .filter((shape) => selectedSet.has(shape.id))
      .map((shape) => {
        const clone = cloneShape(shape);
        const moved = moveShape(clone, 10, 10);
        return {
          ...moved,
          name: `${shape.name} копия`,
          groupId: shape.groupId ? (groupMap.get(shape.groupId) ?? null) : null,
        };
      });

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      groups: [...prev.groups, ...newGroups],
      shapes: [...prev.shapes, ...clones],
    }));
    onSelectionChange(selectOnly(clones[0]?.id ?? null));
  }

  function mirrorSelected(axis: MirrorAxis) {
    const selectionIds = getSelectionShapeIds(document, selection);
    if (selectionIds.length === 0) return;

    const bounds = getSelectionBox(document, selection);
    const origin = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };

    const idSet = new Set(selectionIds);

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        idSet.has(shape.id) ? mirrorShape(shape, axis, origin) : shape,
      ),
    }));
    setIsSelectionHover(false);
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

  function findConstraintTargetAtPoint(
    point: SketchPolylinePoint,
    sourceShapeId: string,
    sourceEdge: ConstraintEdge,
  ): ConstraintDraftTarget | null {
    const axis = edgeAxis(sourceEdge);
    const compatibleEdges = getCompatibleEdges(axis);
    const tolerance = Math.max(4, 10 / view.scale);

    let best:
      | {
          target: ConstraintDraftTarget;
          score: number;
        }
      | null = null;

    const sheetBounds = getSheetBounds(document);
    for (const edge of compatibleEdges) {
      const dist = edgeDistanceToPoint(point, sheetBounds, edge);
      if (dist <= tolerance) {
        const score = dist;
        if (!best || score < best.score) {
          best = {
            target: { kind: "sheet", edge },
            score,
          };
        }
      }
    }

    for (const shape of document.shapes) {
      if (shape.id === sourceShapeId) continue;

      const bounds = shapeBounds(shape);
      for (const edge of compatibleEdges) {
        const dist = edgeDistanceToPoint(point, bounds, edge);
        if (dist <= tolerance) {
          const score = dist;
          if (!best || score < best.score) {
            best = {
              target: {
                kind: "shape",
                shapeId: shape.id,
                edge,
              },
              score,
            };
          }
        }
      }
    }

    return best?.target ?? null;
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 2 && (draft || polylineDraft.length > 0)) {
      event.preventDefault();
      cancelCurrentDraft();
      return;
    }

    if (isPanMouseButton(event.button)) {
      const shouldClearSelectionOnPointerUp =
        tool === "select" &&
        event.button === 2 &&
        selection.ids.length > 0;

      startPan(event, {
        clearSelectionOnPointerUp: shouldClearSelectionOnPointerUp,
      });
      return;
    }

    if (event.button !== 0) return;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    if (tool === "rectangle") {
      setDraft(startRectangleDraft(cad.x, cad.y));
      setIsSelectionHover(false);
      return;
    }

    if (tool === "circle") {
      setDraft(startCircleDraft(cad.x, cad.y));
      setIsSelectionHover(false);
      return;
    }

    if (tool === "line") {
      setDraft(startLineDraft(cad.x, cad.y));
      setIsSelectionHover(false);
      return;
    }

    if (tool === "arc") {
      setIsSelectionHover(false);

      if (!draft) {
        setDraft(startArcRadiusDraft(cad.x, cad.y));
        return;
      }

      if (draft.type === "arc" && draft.stage === "radius") {
        const radius = distance(
          { x: draft.centerX, y: draft.centerY },
          { x: cad.x, y: cad.y },
        );

        if (radius < 0.5) {
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
        const committed = getArcFromDraft({
          ...draft,
          endX: cad.x,
          endY: cad.y,
        });

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

    if (tool === "polyline") {
      setPolylineDraft((prev) => {
        const last = prev[prev.length - 1];
        if (isSamePoint(last, cad)) {
          return prev;
        }
        return appendPolylinePoint(prev, { x: cad.x, y: cad.y });
      });
      setPolylineHoverPoint(cad);
      setIsSelectionHover(false);
      return;
    }

    if (tool === "text") {
      checkpointHistory();
      addText(cad.x, cad.y);
      return;
    }

    if (tool === "select") {
      onSelectionChangeSilently(clearSelection());
      setIsSelectionHover(false);
    }
  }

  function handleCanvasPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (panState && panState.pointerId === event.pointerId) {
      const moved =
        Math.abs(event.clientX - panState.startClientX) > 3 ||
        Math.abs(event.clientY - panState.startClientY) > 3;

      onViewChangeSilently((prev) => ({
        ...prev,
        offsetX: panState.startOffsetX + (event.clientX - panState.startClientX),
        offsetY: panState.startOffsetY + (event.clientY - panState.startClientY),
      }));

      if (moved && !panState.moved) {
        setPanState((prev) => (prev ? { ...prev, moved: true } : prev));
      }
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;
    const cad = normalizePoint(rawCad);

    if (tool === "polyline") {
      setPolylineHoverPoint(cad);
    }

    if (
      constraintCreateState &&
      constraintCreateState.pointerId === event.pointerId
    ) {
      setConstraintCreateState({
        ...constraintCreateState,
        pointer: cad,
        hoverTarget: findConstraintTargetAtPoint(
          cad,
          constraintCreateState.shapeId,
          constraintCreateState.edge,
        ),
      });
      return;
    }

    if (
      constraintLabelDragState &&
      constraintLabelDragState.pointerId === event.pointerId
    ) {
      const axisDelta =
        constraintLabelDragState.axis === "x"
          ? cad.x - constraintLabelDragState.startPoint.x
          : cad.y - constraintLabelDragState.startPoint.y;

      const nextDistance = Number(
        (
          constraintLabelDragState.initialDistance +
          axisDelta * constraintLabelDragState.sign
        ).toFixed(3),
      );

      setDocumentSilently((prev) =>
        updateConstraint(prev, constraintLabelDragState.constraintId, {
          distance: nextDistance,
        }),
      );
      return;
    }

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
      return;
    }

    if (transformState?.kind === "scale" && transformState.pointerId === event.pointerId) {
      const currentDistance = Math.hypot(
        cad.x - transformState.origin.x,
        cad.y - transformState.origin.y,
      );

      const uniformScale = clamp(
        currentDistance / Math.max(0.0001, transformState.startDistance),
        0.05,
        100,
      );

      setDocumentSilently((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) => {
          const initial = transformState.initialShapes[shape.id];
          return initial
            ? scaleShape(initial, uniformScale, uniformScale, transformState.origin)
            : shape;
        }),
      }));
      return;
    }

    if (transformState?.kind === "rotate" && transformState.pointerId === event.pointerId) {
      const currentAngle = angleBetween(transformState.center, cad);
      const deltaDeg =
        ((currentAngle - transformState.startAngle) * 180) / Math.PI;

      setDocumentSilently((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) => {
          const initial = transformState.initialShapes[shape.id];
          return initial
            ? rotateShape(initial, deltaDeg, transformState.center)
            : shape;
        }),
      }));
    }
  }

  function finishConstraintCreate() {
    if (!constraintCreateState) return;

    const sourceShape = document.shapes.find(
      (item) => item.id === constraintCreateState.shapeId,
    );
    if (!sourceShape) {
      setConstraintCreateState(null);
      return;
    }

    const target = constraintCreateState.hoverTarget;
    if (!target) {
      setConstraintCreateState(null);
      return;
    }

    const sourceBounds = shapeBounds(sourceShape);
    const targetBounds =
      target.kind === "sheet"
        ? getSheetBounds(document)
        : shapeBounds(
            document.shapes.find((item) => item.id === target.shapeId)!,
          );

    const dist = getDistanceBetweenEdges(
      sourceBounds,
      constraintCreateState.edge,
      targetBounds,
      target.edge,
    );

    setDocument((prev) =>
      upsertConstraintForEdge(prev, {
        enabled: true,
        shapeId: constraintCreateState.shapeId,
        edge: constraintCreateState.edge,
        target:
          target.kind === "sheet"
            ? { kind: "sheet" }
            : { kind: "shape", shapeId: target.shapeId },
        targetEdge: target.edge,
        distance: dist,
      }),
    );

    setConstraintCreateState(null);
  }

  function handleCanvasPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (constraintCreateState && constraintCreateState.pointerId === event.pointerId) {
      finishConstraintCreate();
      return;
    }

    if (
      constraintLabelDragState &&
      constraintLabelDragState.pointerId === event.pointerId
    ) {
      setConstraintLabelDragState(null);
      return;
    }

    if (draft?.type === "rectangle") {
      const rect = getRectangleFromDraft(draft);
      checkpointHistory();
      addRectangle(rect.x, rect.y, rect.width, rect.height);
      setDraft(null);
    } else if (draft?.type === "circle") {
      const circle = getCircleFromDraft(draft);
      checkpointHistory();
      addCircle(circle.cx, circle.cy, circle.radius);
      setDraft(null);
    } else if (draft?.type === "line") {
      const line = getLineFromDraft(draft);
      checkpointHistory();
      addLine(line.x1, line.y1, line.x2, line.y2);
      setDraft(null);
    }

    if (panState && panState.pointerId === event.pointerId) {
      const shouldClearSelection =
        panState.clearSelectionOnPointerUp &&
        !panState.moved &&
        tool === "select";

      setDragState(finishDrag());
      setPanState(null);
      setTransformState(null);
      setIsSelectionHover(false);

      if (shouldClearSelection) {
        onSelectionChangeSilently(clearSelection());
      }
      return;
    }

    setDragState(finishDrag());
    setPanState(null);
    setTransformState(null);
    setIsSelectionHover(false);
  }

  function handleCanvasPointerLeave(event: React.PointerEvent<SVGSVGElement>) {
    if (tool === "polyline") {
      setPolylineHoverPoint(null);
    }

    if (draft?.type === "arc") {
      setPanState(null);
      return;
    }

    handleCanvasPointerUp(event);
  }

  function handleCanvasContextMenu(event: React.MouseEvent<SVGSVGElement>) {
    if (draft || polylineDraft.length > 0) {
      event.preventDefault();
      cancelCurrentDraft();
    }
  }

  function handleCanvasDoubleClick(event: React.MouseEvent<SVGSVGElement>) {
    if (tool !== "polyline") {
      return;
    }

    if (polylineDraft.length < 2) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    checkpointHistory();
    commitPolyline();
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
      constraints: document.constraints.filter(
        (constraint) =>
          !selection.ids.includes(constraint.shapeId) &&
          !(
            constraint.target.kind === "shape" &&
            selection.ids.includes(constraint.target.shapeId)
          ),
      ),
    };

    setDocument(nextDocument);
    onSelectionChange(normalizeSelectionAfterDelete(nextDocument, clearSelection()));
    setIsSelectionHover(false);
  }

  function deleteShape(shapeId: string) {
    checkpointHistory();

    const nextDocument = {
      ...document,
      shapes: document.shapes.filter((shape) => shape.id !== shapeId),
      constraints: document.constraints.filter(
        (constraint) =>
          constraint.shapeId !== shapeId &&
          !(
            constraint.target.kind === "shape" &&
            constraint.target.shapeId === shapeId
          ),
      ),
    };

    setDocument(nextDocument);
    onSelectionChange(normalizeSelectionAfterDelete(nextDocument, selection));
    setIsSelectionHover(false);
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
    setIsSelectionHover(false);
  }

  function ungroupSelected() {
    checkpointHistory();
    setDocument((prev) => ungroupSelectedShapes(prev, selection));
    setIsSelectionHover(false);
  }

  function bindSelectStart(event: React.PointerEvent<SVGElement>, shapeId: string) {
    if (tool !== "select") {
      return;
    }

    if (isPanMouseButton(event.button)) {
      event.stopPropagation();
      startPan(event);
      return;
    }

    event.stopPropagation();

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

    if (event.button !== 0) {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    checkpointHistory();
    setIsSelectionHover(false);

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

    if (isPanMouseButton(event.button)) {
      startPan(event);
      return;
    }

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
    setIsSelectionHover(false);

    setDragState(
      startDrag(
        selection.primaryId,
        cad.x,
        cad.y,
        getDragShapeIds(document, selection.primaryId, selection),
      ),
    );
  }

  function bindScaleHandleStart(
    event: React.PointerEvent<SVGCircleElement>,
    handle: ScaleHandle,
  ) {
    event.stopPropagation();

    if (tool !== "select" || event.button !== 0 || selection.ids.length === 0) {
      return;
    }

    const bounds = getSelectionBox(document, selection);
    const origin = getScaleOrigin(bounds, handle);
    const handlePoint = getScaleHandlePoint(bounds, handle);
    const selectionIds = getSelectionShapeIds(document, selection);

    checkpointHistory();
    setIsSelectionHover(false);

    setTransformState({
      kind: "scale",
      pointerId: event.pointerId,
      selectionIds,
      origin,
      startDistance: Math.max(
        0.0001,
        Math.hypot(handlePoint.x - origin.x, handlePoint.y - origin.y),
      ),
      initialShapes: buildShapeSnapshot(document, selectionIds),
    });
  }

  function bindRotateHandleStart(event: React.PointerEvent<SVGCircleElement>) {
    event.stopPropagation();

    if (tool !== "select" || event.button !== 0 || selection.ids.length === 0) {
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const bounds = getSelectionBox(document, selection);
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };

    const selectionIds = getSelectionShapeIds(document, selection);

    checkpointHistory();
    setIsSelectionHover(false);

    setTransformState({
      kind: "rotate",
      pointerId: event.pointerId,
      selectionIds,
      center,
      startAngle: angleBetween(center, rawCad),
      initialShapes: buildShapeSnapshot(document, selectionIds),
    });
  }

  function bindConstraintEdgeHandleStart(
    event: React.PointerEvent<SVGCircleElement>,
    edge: ConstraintEdge,
  ) {
    event.stopPropagation();

    if (tool !== "select" || event.button !== 0 || !selection.primaryId) {
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    checkpointHistory();
    setIsSelectionHover(false);

    setConstraintCreateState({
      pointerId: event.pointerId,
      shapeId: selection.primaryId,
      edge,
      pointer: rawCad,
      hoverTarget: findConstraintTargetAtPoint(rawCad, selection.primaryId, edge),
    });
  }

  function bindConstraintLabelDragStart(
    event: React.PointerEvent<SVGRectElement>,
    constraintId: string,
  ) {
    event.stopPropagation();

    if (tool !== "select" || event.button !== 0) {
      return;
    }

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const constraint = document.constraints.find((item) => item.id === constraintId);
    if (!constraint) return;

    checkpointHistory();
    setIsSelectionHover(false);

    setConstraintLabelDragState({
      pointerId: event.pointerId,
      constraintId,
      axis: edgeAxis(constraint.edge),
      sign: constraint.edge === "left" || constraint.edge === "bottom" ? 1 : -1,
      startPoint: rawCad,
      initialDistance: constraint.distance,
    });
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

  const arrayPreviewShapes = useMemo(() => {
    if (!arrayToolMode || selection.ids.length === 0) {
      return [];
    }

    if (editingArrayGroupId) {
      const group = document.groups.find((item) => item.id === editingArrayGroupId);
      if (!group?.array) {
        return [];
      }

      const nextDefinition =
        arrayToolMode === "linear"
          ? {
              type: "linear" as const,
              sourceShapeIds: group.array.sourceShapeIds,
              params: linearArrayParams,
            }
          : {
              type: "circular" as const,
              sourceShapeIds: group.array.sourceShapeIds,
              params: circularArrayParams,
            };

      const result = rebuildArrayGroup(document, editingArrayGroupId, nextDefinition);

      return result.document.shapes.filter((shape) =>
        result.createdShapeIds.includes(shape.id),
      );
    }

    const result =
      arrayToolMode === "linear"
        ? applyLinearArray(document, selection, linearArrayParams)
        : applyCircularArray(document, selection, circularArrayParams);

    return result.document.shapes.filter((shape) =>
      result.createdShapeIds.includes(shape.id),
    );
  }, [
    arrayToolMode,
    editingArrayGroupId,
    document,
    selection,
    linearArrayParams,
    circularArrayParams,
  ]);

  const isDragging = dragState !== null;
  const isPanning = panState !== null;
  const isTransforming =
    transformState !== null ||
    constraintCreateState !== null ||
    constraintLabelDragState !== null;

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
    resetView,
    commitPolyline,
    cancelCurrentDraft,
    cloneSelected,
    mirrorSelected,
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
    handleCanvasPointerLeave,
    handleCanvasContextMenu,
    handleCanvasDoubleClick,
    handleCanvasWheel,
    bindSelectStart,
    bindSelectionDragStart,
    bindScaleHandleStart,
    bindRotateHandleStart,
    bindConstraintEdgeHandleStart,
    bindConstraintLabelDragStart,
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

    startLinearArray,
    startCircularArray,
    applyArray,
    closeArrayTool,
    updateLinearArrayParams,
    updateCircularArrayParams,
    editArrayGroupById,
    arrayTool: {
      mode: arrayToolMode,
      linear: linearArrayParams,
      circular: circularArrayParams,
      editingGroupId: editingArrayGroupId,
    },

    isDragging,
    isPanning,
    isTransforming,
    isSelectionHover,
    setIsSelectionHover,
    constraintDraft:
      constraintCreateState === null
        ? null
        : {
            shapeId: constraintCreateState.shapeId,
            edge: constraintCreateState.edge,
            pointer: constraintCreateState.pointer,
            hoverTarget: constraintCreateState.hoverTarget,
          },

    arrayPreviewShapes,
  };
}
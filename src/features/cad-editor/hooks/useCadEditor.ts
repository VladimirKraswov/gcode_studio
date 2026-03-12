import type {
  SketchConstraint,
  SketchConstraintType,
  SketchDocument,
<<<<<<< HEAD
  SketchPoint,
  SketchPolylinePoint,
  SketchShape,
} from "./types";
import type { SelectionState } from "./selection";

import { clearSelection, makeConstraintRef, selectOnly } from "./selection";

import {
  addConstraint,
  createConstraint,
  getConstraintPointIds,
  makePointTarget,
  makeTypedShapeTarget,
  removeConstraint,
} from "./constraints";
=======
  SketchPolylinePoint,
  SketchTool,
  MirrorAxis,
  SketchShape,
  SketchBSpline,
  SketchArrayDefinition,
  SketchConstraintType,
} from "../model/types";
import type { SelectionState } from "../model/selection";
import {
  clearSelection,
  makeConstraintRef,
  makePointRef,
  makeShapeRef,
  selectOnly,
} from "../model/selection";
import {
  groupSelectedShapes,
  ungroupSelectedShapes,
} from "../model/grouping";
import { generateSketchGCode } from "../cam/generateSketchGCode";
import { screenToCadPoint } from "@/utils/coordinates";
import { clamp } from "@/shared/utils/common";
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
import { addConstraint, createConstraint, removeConstraint } from "../model/constraints";
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
import { createQuickConstraintFromSelection } from "../model/constraintFacade";
import {
  cloneSelectedEntities,
  collectDraggedPointIds,
  deleteSelectedEntities,
  deleteShapeCascade,
  mirrorSelectedEntities,
} from "../model/editorFacade";
import { materializeSnappedPoint } from "../model/constraintFacade";
import {
  buildGroupShapeSelection,
  isPointSelectionId,
  resolveDragSelectionIds,
  resolveSelectionOnPointerDown,
} from "../model/selectionFacade";
>>>>>>> 602697f (Refactoring)

import { resolveSnap } from "../geometry/snap";
import { createPoint } from "./shapeFactory";
import { updateGeometry } from "./solver/manager";

function isShapeUsableForPointOnObject(shape: SketchShape | undefined): boolean {
  return !!shape && (shape.type === "line" || shape.type === "circle" || shape.type === "arc");
}

function findExistingPointIdByCoords(
  points: SketchPoint[],
  point: { x: number; y: number },
  eps = 0.001,
): string | null {
  const hit = points.find(
    (p) => Math.abs(p.x - point.x) < eps && Math.abs(p.y - point.y) < eps,
  );

  return hit?.id ?? null;
}

export function materializeSnappedPoint(
  document: SketchDocument,
  point: SketchPolylinePoint,
): {
  document: SketchDocument;
  pointId: string;
} {
  const snap = resolveSnap(point, {
    gridStep: Math.max(1, document.snapStep),
    points: document.points,
    shapes: document.shapes,
    tolerance: 6,
  });

  if (snap.kind === "endpoint" && snap.pointId) {
    return {
      document,
      pointId: snap.pointId,
    };
  }

  const existingPointId = findExistingPointIdByCoords(document.points, snap.point);

  if (existingPointId) {
    return {
      document,
      pointId: existingPointId,
    };
  }

  const created = createPoint(snap.point.x, snap.point.y);

  let nextDoc: SketchDocument = {
    ...document,
    points: [...document.points, created],
  };

  if (
    snap.kind === "midpoint" &&
    snap.relatedPointIds &&
    snap.relatedPointIds.length >= 2
  ) {
    nextDoc = addConstraint(
      nextDoc,
      createConstraint("midpoint", [
        makePointTarget(created.id),
        makePointTarget(snap.relatedPointIds[0]),
        makePointTarget(snap.relatedPointIds[1]),
      ]),
    );
  }

  if (snap.kind === "point-on-object" && snap.shapeId) {
    const targetShape = nextDoc.shapes.find((shape) => shape.id === snap.shapeId);

    if (isShapeUsableForPointOnObject(targetShape)) {
      nextDoc = addConstraint(
        nextDoc,
        createConstraint("point-on-object", [
          makePointTarget(created.id),
          makeTypedShapeTarget(targetShape),
        ]),
      );
    }
  }

  return {
    document: nextDoc,
    pointId: created.id,
  };
}

export function buildQuickConstraintFromSelection(params: {
  type: SketchConstraintType;
  document: SketchDocument;
  selection: SelectionState;
}): SketchConstraint | null {

  const { type, document, selection } = params;

  const selectedShapes = document.shapes.filter((shape) =>
    selection.ids.includes(shape.id)
  );

  const selectedPoints = document.points.filter((point) =>
    selection.ids.includes(point.id)
  );

  if (type === "lock") {
    const targetPoint =
      selectedPoints[0] ??
      (() => {
        const shape = selectedShapes[0] as any;
        const pointId = shape?.p1 ?? shape?.center ?? shape?.pointIds?.[0];
        return document.points.find((p) => p.id === pointId) ?? null;
      })();

<<<<<<< HEAD
    if (!targetPoint) return null;

    return createConstraint("lock", [
      makePointTarget(targetPoint.id),
    ]);
  }
=======
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
>>>>>>> 602697f (Refactoring)

  if (type === "point-on-object") {

    if (selectedPoints.length < 1 || selectedShapes.length < 1) return null;

    return createConstraint("point-on-object", [
      makePointTarget(selectedPoints[0].id),
      makeTypedShapeTarget(selectedShapes[0]),
    ]);
  }

  if (type === "midpoint") {

    if (selectedPoints.length < 1) return null;

    const line = selectedShapes.find((shape) => shape.type === "line");
    if (!line) return null;

    const l = line as any;

    return createConstraint("midpoint", [
      makePointTarget(selectedPoints[0].id),
      makePointTarget(l.p1),
      makePointTarget(l.p2),
    ]);
  }

<<<<<<< HEAD
  if (
    type === "parallel" ||
    type === "perpendicular" ||
    type === "equal" ||
    type === "collinear" ||
    type === "angle"
  ) {
=======
  const focusCreatedShape = useCallback((shapeId: string) => {
    setToolState("select");
    onSelectionChange(selectOnly(makeShapeRef(shapeId)));
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setIsSelectionHover(false);
  }, [onSelectionChange]);
>>>>>>> 602697f (Refactoring)

    const lines = selectedShapes.filter((shape) => shape.type === "line");
    if (lines.length < 2) return null;

    const a = lines[0] as any;
    const b = lines[1] as any;

<<<<<<< HEAD
    return createConstraint(
      type,
      [
        makePointTarget(a.p1),
        makePointTarget(a.p2),
        makePointTarget(b.p1),
        makePointTarget(b.p2),
=======
    let nextDoc = { ...document };
    const pointIds: string[] = [];

    for (const draftPoint of polylineDraft) {
      const result = materializeSnappedPoint(nextDoc, draftPoint);
      nextDoc = result.document;
      pointIds.push(result.pointId);
    }

    const dedupedPointIds = pointIds.filter((id, index, arr) => index === 0 || arr[index - 1] !== id);
    if (dedupedPointIds.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    const shape = createPolylineShape(
      `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      dedupedPointIds,
      false,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, polylineDraft, checkpointHistory, setDocument, focusCreatedShape]);

  const commitBSpline = useCallback(() => {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    checkpointHistory();

    let nextDoc = { ...document };
    const pointIds: string[] = [];

    for (const draftPoint of polylineDraft) {
      const result = materializeSnappedPoint(nextDoc, draftPoint);
      nextDoc = result.document;
      pointIds.push(result.pointId);
    }

    const dedupedPointIds = pointIds.filter((id, index, arr) => index === 0 || arr[index - 1] !== id);
    if (dedupedPointIds.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    const shape = createBSplineShape(
      `Spline ${document.shapes.filter((s) => s.type === "bspline").length + 1}`,
      dedupedPointIds,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, polylineDraft, checkpointHistory, setDocument, focusCreatedShape]);

  const isPanMouseButton = useCallback((button: number): boolean => {
    if (panButtonMode === "middle") return button === 1;
    if (panButtonMode === "right") return button === 2;
    return button === 1 || button === 2;
  }, [panButtonMode]);

  const closeArrayTool = useCallback(() => {
    setArrayToolMode(null);
    setEditingArrayGroupId(null);
  }, []);

  const startLinearArray = useCallback(() => {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("linear");
  }, [selection.ids.length]);

  const startCircularArray = useCallback(() => {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("circular");
  }, [selection.ids.length]);

  const editArrayGroupById = useCallback((groupId: string) => {
    const group = document.groups.find((item) => item.id === groupId);
    if (!group?.array) return;

    const sourceIds = group.array.sourceShapeIds.filter((id) =>
      document.shapes.some((shape) => shape.id === id),
    );
    if (sourceIds.length === 0) return;

    onSelectionChange({
      refs: sourceIds.map((id) => makeShapeRef(id)),
      primaryRef: makeShapeRef(sourceIds[0] ?? ""),
      ids: sourceIds,
      primaryId: sourceIds[0] ?? null,
    });

    setEditingArrayGroupId(groupId);

    if (group.array.type === "linear") {
      setLinearArrayParams(group.array.params as any);
      setArrayToolMode("linear");
    } else {
      setCircularArrayParams(group.array.params as any);
      setArrayToolMode("circular");
    }
  }, [document.groups, document.shapes, onSelectionChange]);

  const applyArray = useCallback(() => {
    if (selection.ids.length === 0 || !arrayToolMode) return;
    checkpointHistory();

    if (editingArrayGroupId) {
      const group = document.groups.find((item) => item.id === editingArrayGroupId);
      if (!group?.array) {
        setEditingArrayGroupId(null);
        setArrayToolMode(null);
        return;
      }

      const nextDefinition: SketchArrayDefinition =
        arrayToolMode === "linear"
          ? {
              type: "linear",
              sourceShapeIds: group.array.sourceShapeIds,
              params: linearArrayParams as any,
            }
          : {
              type: "circular",
              sourceShapeIds: group.array.sourceShapeIds,
              params: circularArrayParams as any,
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
  }, [selection, arrayToolMode, checkpointHistory, editingArrayGroupId, document, linearArrayParams, circularArrayParams, setDocument]);

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
  }, [polylineDraft, tool, commitPolyline, commitBSpline]);

  const startPan = useCallback((
    event: React.PointerEvent<SVGElement | SVGSVGElement>,
    options?: { clearSelectionOnPointerUp?: boolean },
  ) => {
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
  }, [view.offsetX, view.offsetY, checkpointHistory]);

  const cancelCurrentDraft = useCallback(() => {
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setDragState(null);
    setIsSelectionHover(false);
  }, []);

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

  const getCadPoint = useCallback((event: React.PointerEvent<SVGElement>) => {
    if (!svgRef.current) return null;
    return screenToCadPoint(
      event.clientX,
      event.clientY,
      svgRef.current.getBoundingClientRect(),
      document.height,
      view,
    );
  }, [document.height, view]);

  const addCircle = useCallback((cx: number, cy: number, radius: number) => {
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

    if (dy < dx * 0.05) {
      nextDoc.constraints.push(createConstraint("horizontal", [makePointRef(p1.id).id, makePointRef(p2.id).id]));
    } else if (dx < dy * 0.05) {
      nextDoc.constraints.push(createConstraint("vertical", [makePointRef(p1.id).id, makePointRef(p2.id).id]));
    }

    const shape = createLineShape(
      `Line ${document.shapes.filter((s) => s.type === "line").length + 1}`,
      p1.id,
      p2.id,
    );

    checkpointHistory();
    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addArc = useCallback((
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    clockwise = false,
  ) => {
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
  }, [document, checkpointHistory, setDocument, focusCreatedShape]);

  const addRectangle = useCallback((x1: number, y1: number, x2: number, y2: number) => {
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
      createConstraint("horizontal", [p1.id, p2.id]),
      createConstraint("vertical", [p2.id, p3.id]),
      createConstraint("horizontal", [p3.id, p4.id]),
      createConstraint("vertical", [p4.id, p1.id]),
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
>>>>>>> 602697f (Refactoring)
      ],
      type === "angle" ? 90 : undefined,
    );
  }

<<<<<<< HEAD
  if (type === "radius" || type === "diameter") {

    const shape = selectedShapes.find(
      (s) => s.type === "circle" || s.type === "arc",
=======
    setDocument(nextDoc);
    setToolState("select");
    onSelectionChange(buildGroupShapeSelection([l1, l2, l3, l4]));
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
    setIsSelectionHover(false);
  }, [document, checkpointHistory, setDocument, onSelectionChange]);

  const addEllipse = useCallback((cx: number, cy: number, mx: number, my: number) => {
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
>>>>>>> 602697f (Refactoring)
    );

    if (!shape) return null;

    const s = shape as any;

    const value =
      type === "diameter"
        ? s.radius * 2
        : s.radius;

    const pointIds =
      shape.type === "circle"
        ? [s.center]
        : [s.center, s.p1];

    return createConstraint(
      type,
      [
        ...pointIds.map((id) => makePointTarget(id)),
        makeTypedShapeTarget(shape),
      ],
      value,
    );
  }

  const pointIds = selectedPoints.map((p) => p.id);

  if (pointIds.length < 2 && selectedShapes.length > 0) {
    const s = selectedShapes[0] as any;

    if (s.p1) pointIds.push(s.p1);
    if (s.p2) pointIds.push(s.p2);
    if (s.center) pointIds.push(s.center);
  }

  if (pointIds.length < 2) return null;

<<<<<<< HEAD
  return createConstraint(
    type,
    [
      makePointTarget(pointIds[0]),
      makePointTarget(pointIds[1]),
    ],
    ["distance", "distance-x", "distance-y"].includes(type) ? 50 : undefined,
  );
}

export function addQuickConstraintFromSelection(params: {
  type: SketchConstraintType;
  document: SketchDocument;
  selection: SelectionState;
}): SketchDocument | null {

  const constraint = buildQuickConstraintFromSelection(params);

  if (!constraint) return null;

  return addConstraint(params.document, constraint);
}

export function updateConstraintValueInDocument(
  document: SketchDocument,
  constraintId: string,
  value: number,
): SketchDocument {

  if (!Number.isFinite(value)) return document;

  return updateGeometry({
    ...document,
    constraints: document.constraints.map((constraint) =>
      constraint.id === constraintId
        ? { ...constraint, value }
        : constraint,
    ),
  });
}

export function deleteConstraintInDocument(
  document: SketchDocument,
  constraintId: string,
): SketchDocument {

  return removeConstraint(document, constraintId);
}

export function buildConstraintSelection(constraintId: string) {
  return selectOnly(makeConstraintRef(constraintId));
}

export function buildSelectionAfterConstraintDelete() {
  return clearSelection();
}

export function collectUsedPointIdsFromConstraint(
  constraint: SketchConstraint,
): string[] {

  return getConstraintPointIds(constraint);
=======
    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? resolveSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
          shapes: document.shapes,
          tolerance: 6,
        }).point
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
      addText(cad.x, cad.y);
      return;
    }

    if (tool === "trim") {
      const hit = hitTestShapes(cad, document.shapes, document.points);
      if (hit) {
        checkpointHistory();
        setDocument((prev) => deleteShapeCascade(prev, hit.id));
      }
      return;
    }

    if (tool === "select") {
      onSelectionChangeSilently(clearSelection());
    }
  }, [tool, draft, polylineDraft, isPanMouseButton, startPan, getCadPoint, document, addText, addArc, cancelCurrentDraft, checkpointHistory, setDocument, onSelectionChangeSilently, selection.ids.length]);

  const handleCanvasPointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
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
      ? resolveSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
          shapes: document.shapes,
          tolerance: 6,
        }).point
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
            : [activePointId],
        );

        setDocumentSilently((prev) => movePointsAndSolve(prev, pointIds, next.dx, next.dy));
        setDragState(next.next);
        return;
      }

      const selectedIds =
        dragState.selectionIds.length > 0
          ? dragState.selectionIds
          : [dragState.shapeId];

      const { affectedPointIds, nonParametricShapeIds } = collectDraggedPointIds(
        document,
        selectedIds,
      );

      setDocumentSilently((prev) => {
        let nextDoc = movePointsAndSolve(prev, affectedPointIds, next.dx, next.dy);

        if (nonParametricShapeIds.size > 0) {
          nextDoc = {
            ...nextDoc,
            shapes: nextDoc.shapes.map((shape) => {
              if (nonParametricShapeIds.has(shape.id)) {
                return {
                  ...shape,
                  x: (shape as any).x + next.dx,
                  y: (shape as any).y + next.dy,
                } as any;
              }
              return shape;
            }),
          };
        }

        return nextDoc;
      });

      setDragState(next.next);
    }
  }, [panState, dragState, tool, draft, getCadPoint, document, onViewChangeSilently, setDocumentSilently]);

  const handleCanvasPointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
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
  }, [draft, tool, panState, addRectangle, addCircle, addEllipse, addLine, onSelectionChangeSilently]);

  const bindSelectStart = useCallback((event: React.PointerEvent<SVGElement>, rawId: string) => {
    if (tool !== "select") return;

    if (isPanMouseButton(event.button)) {
      event.stopPropagation();
      startPan(event);
      return;
    }

    event.stopPropagation();

    const { ref, nextSelection } = resolveSelectionOnPointerDown({
      selection,
      rawId,
      shiftKey: event.shiftKey,
    });

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? resolveSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
          shapes: document.shapes,
          tolerance: 6,
        }).point
      : rawCad;

    if (nextSelection !== selection) {
      onSelectionChangeSilently(nextSelection);
    }

    if (event.button !== 0 || event.shiftKey) return;

    checkpointHistory();

    const dragIds = resolveDragSelectionIds({
      document,
      ref,
      nextSelection,
    });

    if (ref.kind === "point") {
      setDragState({
        shapeId: `point:${ref.id}`,
        startX: cad.x,
        startY: cad.y,
        selectionIds: dragIds,
      });
    } else if (ref.kind === "shape") {
      setDragState(
        createDragState(
          ref.id,
          cad.x,
          cad.y,
          dragIds,
        ),
      );
    }
  }, [
    tool,
    isPanMouseButton,
    startPan,
    selection,
    getCadPoint,
    document,
    onSelectionChangeSilently,
    checkpointHistory,
  ]);

  const bindSelectionDragStart = useCallback((event: React.PointerEvent<SVGRectElement>) => {
    if (isPanMouseButton(event.button)) {
      startPan(event);
      return;
    }

    if (tool !== "select" || event.button !== 0 || !selection.primaryId) return;

    const rawCad = getCadPoint(event);
    if (!rawCad) return;

    const cad = document.snapEnabled
      ? resolveSnap(rawCad, {
          gridStep: Math.max(1, document.snapStep),
          points: document.points,
          shapes: document.shapes,
          tolerance: 6,
        }).point
      : rawCad;

    checkpointHistory();
    setDragState(
      createDragState(
        selection.primaryId,
        cad.x,
        cad.y,
        resolveDragSelectionIds({
          document,
          ref: isPointSelectionId(selection.primaryId)
            ? makePointRef(selection.primaryId)
            : makeShapeRef(selection.primaryId),
          nextSelection: selection,
        }),
      ),
    );
  }, [isPanMouseButton, startPan, tool, selection, getCadPoint, document, checkpointHistory]);

  const setSelectedBSplineDegree = useCallback((nextDegree: number) => {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;
    const bspline = shape as SketchBSpline;

    const maxDegree = Math.max(1, bspline.controlPointIds.length - 1);
    const degree = Math.max(1, Math.min(maxDegree, Math.round(nextDegree || 1)));

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? ({ ...item, degree } as SketchBSpline)
          : item,
      ),
    }));
  }, [selection.primaryId, document.shapes, checkpointHistory, setDocument]);

  const setSelectedBSplinePeriodic = useCallback((periodic: boolean) => {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;

    checkpointHistory();
    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? ({ ...item, periodic } as SketchBSpline)
          : item,
      ),
    }));
  }, [selection.primaryId, document.shapes, checkpointHistory, setDocument]);

  const insertControlPointToSelectedBSpline = useCallback((x: number, y: number) => {
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
          ? ({
              ...item,
              controlPointIds: result.nextControlPointIds,
              degree: Math.max(1, Math.min((item as SketchBSpline).degree, result.nextControlPointIds.length - 1)),
            } as SketchBSpline)
          : item,
      ),
    }));
  }, [selection.primaryId, document.shapes, document.points, checkpointHistory, setDocument]);

  const removeSelectedPointFromBSpline = useCallback(() => {
    if (!selection.primaryId) return;
    if (!selection.primaryId.startsWith("pt-")) return;

    const selectedPointId = selection.primaryId;
    const ownerSpline = document.shapes.find(
      (shape) =>
        shape.type === "bspline" &&
        (shape as SketchBSpline).controlPointIds.includes(selectedPointId),
    );

    if (!ownerSpline || ownerSpline.type !== "bspline") return;

    const result = removeBSplineControlPoint(ownerSpline, selectedPointId);
    if (!result) return;

    checkpointHistory();

    setDocument((prev) => {
      const nextShapes = prev.shapes.map((shape) =>
        shape.id === ownerSpline.id
          ? ({
              ...shape,
              controlPointIds: result.nextControlPointIds,
              degree: result.nextDegree,
            } as SketchBSpline)
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

    onSelectionChangeSilently(selectOnly(makeShapeRef(ownerSpline.id)));
  }, [selection.primaryId, document.shapes, checkpointHistory, setDocument, onSelectionChangeSilently]);

  const resetView = useCallback(() => {
    onViewChange({ scale: 1, offsetX: 0, offsetY: 0 });
    setIsSelectionHover(false);
  }, [onViewChange]);

  const cloneSelected = useCallback(() => {
    checkpointHistory();
    const result = cloneSelectedEntities(document, selection);
    setDocument(result.document);
    onSelectionChange(result.selection);
  }, [document, selection, checkpointHistory, setDocument, onSelectionChange]);

  const mirrorSelected = useCallback((axis: MirrorAxis) => {
    checkpointHistory();
    setDocument((prev) => mirrorSelectedEntities(prev, selection, axis));
  }, [selection, checkpointHistory, setDocument]);

  const deleteSelected = useCallback(() => {
    checkpointHistory();
    const result = deleteSelectedEntities(document, selection);
    setDocument(result.document);
    onSelectionChange(result.selection);
  }, [document, selection, checkpointHistory, setDocument, onSelectionChange]);

  const deleteShape = useCallback((id: string) =>
    setDocument((doc) => deleteShapeCascade(doc, id)), [setDocument]);

  const renameShape = useCallback((id: string, name: string) =>
    setDocument((doc) => ({
      ...doc,
      shapes: doc.shapes.map((shape) => (shape.id === id ? { ...shape, name } : shape)),
    })), [setDocument]);

  const toggleShapeVisibility = useCallback((id: string) =>
    setDocument((doc) => ({
      ...doc,
      shapes: doc.shapes.map((shape) => (shape.id === id ? { ...shape, visible: !shape.visible } : shape)),
    })), [setDocument]);

  const groupSelected = useCallback(() => setDocument((doc) => groupSelectedShapes(doc, selection)), [setDocument, selection]);
  const ungroupSelected = useCallback(() => setDocument((doc) => ungroupSelectedShapes(doc, selection)), [setDocument, selection]);

  const handleGenerateClick = useCallback(async () => {
    setIsGenerating(true);
    try {
      const gcode = await generateSketchGCode(document);
      onGenerateGCode(gcode);
    } finally {
      setIsGenerating(false);
    }
  }, [document, onGenerateGCode]);

  const handleCanvasPointerLeave = useCallback(() => {
    setDragState(finishDrag());
    setPanState(null);
  }, []);

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool === "polyline" || tool === "bspline") {
      e.preventDefault();
      if (tool === "polyline") commitPolyline();
      else commitBSpline();
    }
  }, [tool, commitPolyline, commitBSpline]);

  const handleCanvasWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
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
  }, [onViewChange]);

  const bindScaleHandleStart = useCallback((_e: any, _handle: any) => {}, []);
  const bindRotateHandleStart = useCallback((_e: any) => {}, []);
  const bindConstraintEdgeHandleStart = useCallback(() => {}, []);
  const bindConstraintLabelDragStart = useCallback(() => {}, []);

  const toggleConstruction = useCallback(() => {
    if (selection.ids.length === 0) return;
    checkpointHistory();

    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        selection.ids.includes(shape.id)
          ? { ...shape, isConstruction: !shape.isConstruction }
          : shape,
      ),
    }));
  }, [selection.ids, checkpointHistory, setDocument]);

  const renameGroup = useCallback((id: string, name: string) =>
    setDocument((doc) => modelRenameGroup(doc, id, name)), [setDocument]);

  const toggleGroupCollapsed = useCallback((id: string) =>
    setDocument((doc) => modelToggleGroupCollapsed(doc, id)), [setDocument]);

  const reorderDocumentShapes = useCallback((ids: string[]) =>
    setDocument((doc) => modelReorderShapes(doc, ids)), [setDocument]);

  const updateLinearArrayParams = useCallback((p: any) =>
    setLinearArrayParams((prev) => ({ ...prev, ...p })), []);

  const updateCircularArrayParams = useCallback((p: any) =>
    setCircularArrayParams((prev) => ({ ...prev, ...p })), []);

  const arrayTool = useMemo(() => ({
    mode: arrayToolMode,
    linear: linearArrayParams,
    circular: circularArrayParams,
    editingGroupId: editingArrayGroupId,
  }), [arrayToolMode, linearArrayParams, circularArrayParams, editingArrayGroupId]);

  const arrayPreviewShapes = useMemo(() => {
    if (!arrayToolMode || selection.ids.length === 0) return [];

    const groupId = "preview-array";
    const definition: SketchArrayDefinition =
      arrayToolMode === "linear"
        ? {
            type: "linear",
            sourceShapeIds: selection.ids,
            params: linearArrayParams as any,
          }
        : {
            type: "circular",
            sourceShapeIds: selection.ids,
            params: circularArrayParams as any,
          };

    const previewDoc = rebuildArrayGroup(
      { ...document, shapes: [...document.shapes] },
      groupId,
      definition,
    );

    return previewDoc.shapes.filter((shape) => shape.groupId === groupId);
  }, [arrayToolMode, selection.ids, document, linearArrayParams, circularArrayParams]);

  const addQuickConstraint = useCallback((type: SketchConstraintType) => {
    const constraint = createQuickConstraintFromSelection(document, selection, type);
    if (!constraint) return;

    checkpointHistory();
    setDocument(addConstraint(document, constraint));
  }, [document, selection, checkpointHistory, setDocument]);

  const onConstraintPointerDown = useCallback((event: React.PointerEvent, id: string) => {
    event.stopPropagation();

    if (id.startsWith("point:")) {
      const pointId = id.split(":")[1];
      bindSelectStart(event as any, `point:${pointId}`);
      return;
    }

    onSelectionChangeSilently(selectOnly(makeConstraintRef(id)));
  }, [bindSelectStart, onSelectionChangeSilently]);

  const updateConstraintValue = useCallback((constraintId: string, value: number) => {
    if (!Number.isFinite(value)) return;

    checkpointHistory();
    setDocument((prev) =>
      updateGeometry({
        ...prev,
        constraints: prev.constraints.map((constraint) =>
          constraint.id === constraintId
            ? { ...constraint, value }
            : constraint,
        ),
      }),
    );
  }, [checkpointHistory, setDocument]);

  const deleteConstraintById = useCallback((constraintId: string) => {
    checkpointHistory();
    setDocument((prev) => removeConstraint(prev, constraintId));
    onSelectionChangeSilently(clearSelection());
  }, [checkpointHistory, setDocument, onSelectionChangeSilently]);

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

    toggleConstruction,

    svgImport,
    startSvgImport,
    closeSvgImport,
    abortSvgImport,
    updateSvgImportDraft,
    confirmSvgImport,

    renameGroup,
    toggleGroupCollapsed,
    reorderDocumentShapes,

    startLinearArray,
    startCircularArray,
    applyArray,
    closeArrayTool,

    updateLinearArrayParams,
    updateCircularArrayParams,

    editArrayGroupById,

    arrayTool,
    arrayPreviewShapes,

    addQuickConstraint,
    onConstraintPointerDown,
    updateConstraintValue,
    deleteConstraintById,
  };
>>>>>>> 602697f (Refactoring)
}
import type {
  SketchConstraint,
  SketchConstraintType,
  SketchDocument,
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

    if (targetShape && isShapeUsableForPointOnObject(targetShape)) {
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

export function createQuickConstraintFromSelection(params: {
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

    if (!targetPoint) return null;

    return createConstraint("lock", [
      makePointTarget(targetPoint.id),
    ]);
  }

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

  if (
    type === "parallel" ||
    type === "perpendicular" ||
    type === "equal" ||
    type === "collinear" ||
    type === "angle"
  ) {

    const lines = selectedShapes.filter((shape) => shape.type === "line");
    if (lines.length < 2) return null;

    const a = lines[0] as any;
    const b = lines[1] as any;

    return createConstraint(
      type,
      [
        makePointTarget(a.p1),
        makePointTarget(a.p2),
        makePointTarget(b.p1),
        makePointTarget(b.p2),
      ],
      type === "angle" ? 90 : undefined,
    );
  }

  if (type === "radius" || type === "diameter") {

    const shape = selectedShapes.find(
      (s) => s.type === "circle" || s.type === "arc",
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

  const constraint = createQuickConstraintFromSelection(params);

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
}
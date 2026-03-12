import { createId } from "./ids";
import { updateGeometry } from "./solver/manager";
import type {
  SketchConstraint,
  SketchConstraintTarget,
  SketchConstraintType,
  SketchDocument,
  SketchShape,
} from "./types";

export type ConstraintIssue = {
  constraintId: string;
  message: string;
};

function isTargetArray(value: unknown[]): value is SketchConstraintTarget[] {
  return value.every((item) => {
    if (!item || typeof item !== "object" || !("kind" in item)) return false;
    const kind = (item as SketchConstraintTarget).kind;
    return (
      kind === "point" ||
      kind === "shape" ||
      kind === "line" ||
      kind === "circle" ||
      kind === "arc"
    );
  });
}

function buildTargetsFromLegacy(
  pointIds: string[],
  shapeIds: string[],
): SketchConstraintTarget[] {
  return [
    ...pointIds.map((pointId) => ({ kind: "point", pointId }) as SketchConstraintTarget),
    ...shapeIds.map((shapeId) => ({ kind: "shape", shapeId }) as SketchConstraintTarget),
  ];
}

export function createConstraint(
  type: SketchConstraintType,
  arg2: SketchConstraintTarget[] | string[],
  arg3?: number | string[],
  arg4?: number,
): SketchConstraint {
  let targets: SketchConstraintTarget[] = [];
  let value: number | undefined;

  if (Array.isArray(arg2) && isTargetArray(arg2)) {
    targets = arg2;
    value = typeof arg3 === "number" ? arg3 : undefined;
  } else {
    const pointIds = Array.isArray(arg2) ? arg2 : [];
    const shapeIds = Array.isArray(arg3) ? arg3 : [];
    value = typeof arg3 === "number" ? arg3 : arg4;
    targets = buildTargetsFromLegacy(pointIds, shapeIds);
  }

  return {
    id: createId("constraint"),
    type,
    targets,
    value,
    enabled: true,
    driven: false,
  };
}

export function makePointTarget(pointId: string): SketchConstraintTarget {
  return { kind: "point", pointId };
}

export function makeShapeTarget(shapeId: string): SketchConstraintTarget {
  return { kind: "shape", shapeId };
}

export function makeTypedShapeTarget(shape: SketchShape): SketchConstraintTarget {
  if (shape.type === "line") return { kind: "line", shapeId: shape.id };
  if (shape.type === "circle") return { kind: "circle", shapeId: shape.id };
  if (shape.type === "arc") return { kind: "arc", shapeId: shape.id };
  return { kind: "shape", shapeId: shape.id };
}

export function getConstraintPointIds(constraint: SketchConstraint): string[] {
  return constraint.targets
    .filter(
      (target): target is Extract<SketchConstraintTarget, { kind: "point" }> =>
        target.kind === "point",
    )
    .map((target) => target.pointId);
}

export function getConstraintShapeIds(constraint: SketchConstraint): string[] {
  return constraint.targets
    .filter(
      (target): target is Exclude<SketchConstraintTarget, { kind: "point" }> =>
        target.kind !== "point",
    )
    .map((target) => target.shapeId);
}

export function isDimensionalConstraint(constraint: SketchConstraint): boolean {
  return [
    "distance",
    "distance-x",
    "distance-y",
    "angle",
    "radius",
    "diameter",
  ].includes(constraint.type);
}

export function removeConstraint(
  document: SketchDocument,
  constraintId: string,
): SketchDocument {
  return {
    ...document,
    constraints: document.constraints.filter(
      (constraint) => constraint.id !== constraintId,
    ),
  };
}

export function addConstraint(
  document: SketchDocument,
  constraint: SketchConstraint,
): SketchDocument {
  const nextDoc = {
    ...document,
    constraints: [...document.constraints, constraint],
  };
  return updateGeometry(nextDoc);
}

export function getConstraintIssues(): ConstraintIssue[] {
  return [];
}
import { createId } from "./ids";
import { updateGeometry } from "./solver/manager";
import type {
  SketchConstraint,
  SketchConstraintType,
  SketchDocument,
} from "./types";

export type ConstraintIssue = {
  constraintId: string;
  message: string;
};

export function createConstraint(
  type: SketchConstraintType,
  pointIds: string[],
  shapeIds: string[],
  value?: number
): SketchConstraint {
  return {
    id: createId("constraint"),
    type,
    pointIds,
    shapeIds,
    value,
    enabled: true,
  };
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
  // TODO: Implement sophisticated constraint validation
  return [];
}

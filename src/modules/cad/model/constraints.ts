import { moveShape } from "./shapeTransforms";
import { shapeBounds, type Bounds2D } from "./shapeBounds";
import { createId } from "./ids";
import type {
  ConstraintEdge,
  SketchDistanceConstraint,
  SketchDocument,
  SketchShape,
} from "./types";

export type ConstraintIssue = {
  constraintId: string;
  message: string;
};

type Axis = "x" | "y";

const EPS = 0.001;
const MAX_PASSES = 6;

function isHorizontalEdge(edge: ConstraintEdge): boolean {
  return edge === "left" || edge === "right";
}

export function edgeAxis(edge: ConstraintEdge): Axis {
  return isHorizontalEdge(edge) ? "x" : "y";
}

function areCompatibleEdges(a: ConstraintEdge, b: ConstraintEdge): boolean {
  return edgeAxis(a) === edgeAxis(b);
}

function edgeLabel(edge: ConstraintEdge): string {
  switch (edge) {
    case "left":
      return "левого";
    case "right":
      return "правого";
    case "top":
      return "верхнего";
    case "bottom":
      return "нижнего";
  }
}

function targetLabel(constraint: SketchDistanceConstraint): string {
  return constraint.target.kind === "sheet" ? "границы листа" : "другого объекта";
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

export function getSheetBounds(document: SketchDocument): Bounds2D {
  return {
    minX: 0,
    minY: 0,
    maxX: document.width,
    maxY: document.height,
  };
}

export function getConstraintTargetBounds(
  document: SketchDocument,
  constraint: SketchDistanceConstraint,
): Bounds2D | null {
  if (constraint.target.kind === "sheet") {
    return getSheetBounds(document);
  }

  const targetShape = document.shapes.find(
    (shape) => constraint.target.kind === "shape" && shape.id === constraint.target.shapeId,
  );

  if (!targetShape) {
    return null;
  }

  return shapeBounds(targetShape);
}

export function getEdgeValue(
  bounds: Bounds2D,
  edge: ConstraintEdge,
): number {
  switch (edge) {
    case "left":
      return bounds.minX;
    case "right":
      return bounds.maxX;
    case "bottom":
      return bounds.minY;
    case "top":
      return bounds.maxY;
  }
}

export function getEdgeMidpoint(
  bounds: Bounds2D,
  edge: ConstraintEdge,
): { x: number; y: number } {
  switch (edge) {
    case "left":
      return { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 };
    case "right":
      return { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 };
    case "bottom":
      return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY };
    case "top":
      return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY };
  }
}

export function distanceSignByEdge(edge: ConstraintEdge): 1 | -1 {
  return edge === "left" || edge === "bottom" ? 1 : -1;
}

export function getDistanceBetweenEdges(
  sourceBounds: Bounds2D,
  sourceEdge: ConstraintEdge,
  targetBounds: Bounds2D,
  targetEdge: ConstraintEdge,
): number {
  const sourceValue = getEdgeValue(sourceBounds, sourceEdge);
  const targetValue = getEdgeValue(targetBounds, targetEdge);

  return round((targetValue - sourceValue) * distanceSignByEdge(sourceEdge) * -1);
}

function computeDesiredMin(
  shape: SketchShape,
  targetBounds: Bounds2D,
  constraint: SketchDistanceConstraint,
): { axis: Axis; desiredMin: number } {
  const bounds = shapeBounds(shape);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const targetValue = getEdgeValue(targetBounds, constraint.targetEdge);

  switch (constraint.edge) {
    case "left":
      return {
        axis: "x",
        desiredMin: round(targetValue + constraint.distance),
      };

    case "right":
      return {
        axis: "x",
        desiredMin: round(targetValue - constraint.distance - width),
      };

    case "bottom":
      return {
        axis: "y",
        desiredMin: round(targetValue + constraint.distance),
      };

    case "top":
      return {
        axis: "y",
        desiredMin: round(targetValue - constraint.distance - height),
      };
  }
}

function buildIssue(
  constraint: SketchDistanceConstraint,
  message: string,
): ConstraintIssue {
  return {
    constraintId: constraint.id,
    message,
  };
}

function uniqueIssues(issues: ConstraintIssue[]): ConstraintIssue[] {
  const seen = new Set<string>();
  const result: ConstraintIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.constraintId}::${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(issue);
  }

  return result;
}

export function createDistanceConstraint(
  input: Omit<SketchDistanceConstraint, "id">,
): SketchDistanceConstraint {
  return {
    id: createId("constraint"),
    ...input,
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

export function updateConstraint(
  document: SketchDocument,
  constraintId: string,
  patch: Partial<SketchDistanceConstraint>,
): SketchDocument {
  return {
    ...document,
    constraints: document.constraints.map((constraint) =>
      constraint.id === constraintId ? { ...constraint, ...patch } : constraint,
    ),
  };
}

export function addConstraint(
  document: SketchDocument,
  constraint: Omit<SketchDistanceConstraint, "id">,
): SketchDocument {
  return {
    ...document,
    constraints: [...document.constraints, createDistanceConstraint(constraint)],
  };
}

export function upsertConstraintForEdge(
  document: SketchDocument,
  constraint: Omit<SketchDistanceConstraint, "id">,
): SketchDocument {
  const existing = document.constraints.find(
    (item) => item.shapeId === constraint.shapeId && item.edge === constraint.edge,
  );

  if (!existing) {
    return addConstraint(document, constraint);
  }

  return {
    ...document,
    constraints: document.constraints.map((item) =>
      item.id === existing.id
        ? {
            ...item,
            ...constraint,
            id: item.id,
          }
        : item,
    ),
  };
}

export function applyDistanceConstraints(document: SketchDocument): {
  document: SketchDocument;
  issues: ConstraintIssue[];
} {
  const issues: ConstraintIssue[] = [];
  let nextDocument: SketchDocument = {
    ...document,
    shapes: [...document.shapes],
  };

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let changed = false;
    const lockedByAxis = new Map<string, number>();

    for (const constraint of nextDocument.constraints) {
      if (!constraint.enabled) {
        continue;
      }

      const shape = nextDocument.shapes.find((item) => item.id === constraint.shapeId);
      if (!shape) {
        issues.push(
          buildIssue(
            constraint,
            "Ограничение не может быть применено: исходный объект не найден.",
          ),
        );
        continue;
      }

      if (
        constraint.target.kind === "shape" &&
        constraint.target.shapeId === constraint.shapeId
      ) {
        issues.push(
          buildIssue(
            constraint,
            "Ограничение не может быть применено: нельзя привязать объект к самому себе.",
          ),
        );
        continue;
      }

      if (!areCompatibleEdges(constraint.edge, constraint.targetEdge)) {
        issues.push(
          buildIssue(
            constraint,
            `Ограничение не может быть применено: расстояние от ${edgeLabel(
              constraint.edge,
            )} ребра до ${edgeLabel(
              constraint.targetEdge,
            )} ребра ${targetLabel(constraint)} задано по другой оси.`,
          ),
        );
        continue;
      }

      const targetBounds = getConstraintTargetBounds(nextDocument, constraint);
      if (!targetBounds) {
        issues.push(
          buildIssue(
            constraint,
            "Ограничение не может быть применено: целевой объект не найден.",
          ),
        );
        continue;
      }

      const { axis, desiredMin } = computeDesiredMin(shape, targetBounds, constraint);
      const lockKey = `${shape.id}:${axis}`;
      const existingLock = lockedByAxis.get(lockKey);

      if (
        existingLock !== undefined &&
        Math.abs(existingLock - desiredMin) > EPS
      ) {
        issues.push(
          buildIssue(
            constraint,
            "Такое расстояние не может быть установлено, потому что оно противоречит другому ограничению по той же оси.",
          ),
        );
        continue;
      }

      lockedByAxis.set(lockKey, desiredMin);

      const bounds = shapeBounds(shape);
      const currentMin = axis === "x" ? bounds.minX : bounds.minY;
      const delta = desiredMin - currentMin;

      if (Math.abs(delta) <= EPS) {
        continue;
      }

      nextDocument = {
        ...nextDocument,
        shapes: nextDocument.shapes.map((item) =>
          item.id === shape.id
            ? moveShape(item, axis === "x" ? delta : 0, axis === "y" ? delta : 0)
            : item,
        ),
      };

      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  return {
    document: nextDocument,
    issues: uniqueIssues(issues),
  };
}

export function getConstraintIssues(
  document: SketchDocument,
  shapeId?: string,
): ConstraintIssue[] {
  const { issues } = applyDistanceConstraints(document);

  if (!shapeId) {
    return issues;
  }

  const ownConstraintIds = new Set(
    document.constraints
      .filter((constraint) => constraint.shapeId === shapeId)
      .map((constraint) => constraint.id),
  );

  return issues.filter((issue) => ownConstraintIds.has(issue.constraintId));
}
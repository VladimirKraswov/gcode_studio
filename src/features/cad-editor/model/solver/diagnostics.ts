import type {
  SketchConstraint,
  SketchDocument,
  SketchPoint,
} from "../types";

export type SketchSolveState =
  | "underdefined"
  | "well-defined"
  | "overdefined"
  | "conflicting";

export type ConstraintDiagnostic = {
  constraintId: string;
  severity: "warning" | "error";
  message: string;
};

export type SketchDiagnostics = {
  dof: number;
  removedDof: number;
  freePointCount: number;
  lockedPointCount: number;
  solveState: SketchSolveState;
  issues: ConstraintDiagnostic[];
  conflictingConstraintIds: string[];
};

function normalizePair(ids: string[]): string {
  return [...ids].sort().join("|");
}

function normalizeQuadAsSegments(ids: string[]): string {
  if (ids.length !== 4) return [...ids].sort().join("|");
  const a = [ids[0], ids[1]].sort().join("|");
  const b = [ids[2], ids[3]].sort().join("|");
  return [a, b].sort().join("::");
}

function samePoint(a: SketchPoint | undefined, b: SketchPoint | undefined, eps = 1e-6): boolean {
  if (!a || !b) return false;
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

function getConstraintRemovedDof(constraint: SketchConstraint): number {
  if (!constraint.enabled) return 0;

  switch (constraint.type) {
    case "coincident":
      return 2;
    case "horizontal":
    case "vertical":
    case "parallel":
    case "perpendicular":
    case "tangent":
    case "equal":
    case "distance":
    case "distance-x":
    case "distance-y":
    case "angle":
    case "radius":
    case "diameter":
      return 1;
    case "symmetric":
      return 2;
    case "lock":
      return 2;
    default:
      return 1;
  }
}

function collectDuplicateConstraintIssues(
  constraints: SketchConstraint[],
): ConstraintDiagnostic[] {
  const issues: ConstraintDiagnostic[] = [];
  const seen = new Map<string, string>();

  for (const c of constraints) {
    if (!c.enabled) continue;

    let key = "";
    switch (c.type) {
      case "horizontal":
      case "vertical":
      case "coincident":
      case "distance":
      case "distance-x":
      case "distance-y":
      case "equal":
        key = `${c.type}:${normalizePair(c.pointIds)}`;
        break;

      case "parallel":
      case "perpendicular":
      case "angle":
      case "symmetric":
        key = `${c.type}:${normalizeQuadAsSegments(c.pointIds)}`;
        break;

      case "radius":
      case "diameter":
      case "tangent":
      case "lock":
        key = `${c.type}:${c.pointIds.join("|")}:${c.shapeIds.join("|")}:${c.value ?? ""}`;
        break;

      default:
        key = `${c.type}:${c.pointIds.join("|")}:${c.shapeIds.join("|")}:${c.value ?? ""}`;
        break;
    }

    const existing = seen.get(key);
    if (existing) {
      issues.push({
        constraintId: c.id,
        severity: "warning",
        message: `Ограничение "${c.type}" дублирует уже существующее (${existing}).`,
      });
    } else {
      seen.set(key, c.id);
    }
  }

  return issues;
}

function collectSimpleConflictIssues(
  constraints: SketchConstraint[],
  pointMap: Map<string, SketchPoint>,
): ConstraintDiagnostic[] {
  const issues: ConstraintDiagnostic[] = [];

  const horizontalMap = new Map<string, string>();
  const verticalMap = new Map<string, string>();
  const lockMap = new Map<string, string>();

  for (const c of constraints) {
    if (!c.enabled) continue;

    if (c.type === "horizontal" && c.pointIds.length >= 2) {
      horizontalMap.set(normalizePair(c.pointIds.slice(0, 2)), c.id);
    }

    if (c.type === "vertical" && c.pointIds.length >= 2) {
      verticalMap.set(normalizePair(c.pointIds.slice(0, 2)), c.id);
    }

    if (c.type === "lock" && c.pointIds.length >= 1) {
      const pid = c.pointIds[0];
      const existing = lockMap.get(pid);
      if (existing) {
        issues.push({
          constraintId: c.id,
          severity: "warning",
          message: `Точка ${pid} уже зафиксирована ограничением ${existing}.`,
        });
      } else {
        lockMap.set(pid, c.id);
      }
    }
  }

  for (const [pairKey, hId] of horizontalMap.entries()) {
    const vId = verticalMap.get(pairKey);
    if (!vId) continue;

    const [aId, bId] = pairKey.split("|");
    const a = pointMap.get(aId);
    const b = pointMap.get(bId);

    if (a && b && !samePoint(a, b)) {
      issues.push({
        constraintId: hId,
        severity: "error",
        message: `Линия между точками ${aId} и ${bId} одновременно ограничена как горизонтальная и вертикальная.`,
      });
      issues.push({
        constraintId: vId,
        severity: "error",
        message: `Линия между точками ${aId} и ${bId} одновременно ограничена как вертикальная и горизонтальная.`,
      });
    }
  }

  return issues;
}

export function analyzeSketchDiagnostics(document: SketchDocument): SketchDiagnostics {
  const points = document.points ?? [];
  const constraints = (document.constraints ?? []).filter((c) => c.enabled);

  const pointMap = new Map(points.map((p) => [p.id, p]));
  const lockedPointIds = new Set(
    points.filter((p) => p.isFixed).map((p) => p.id),
  );

  for (const c of constraints) {
    if (c.type === "lock" && c.pointIds[0]) {
      lockedPointIds.add(c.pointIds[0]);
    }
  }

  const lockedPointCount = lockedPointIds.size;
  const freePointCount = Math.max(0, points.length - lockedPointCount);

  const geometricDof = freePointCount * 2;
  const removedDof = constraints.reduce(
    (sum, c) => sum + getConstraintRemovedDof(c),
    0,
  );

  const dof = geometricDof - removedDof;

  const duplicateIssues = collectDuplicateConstraintIssues(constraints);
  const conflictIssues = collectSimpleConflictIssues(constraints, pointMap);

  const issues = [...duplicateIssues, ...conflictIssues];
  const conflictingConstraintIds = Array.from(
    new Set(
      issues
        .filter((item) => item.severity === "error")
        .map((item) => item.constraintId),
    ),
  );

  let solveState: SketchSolveState = "underdefined";

  if (conflictingConstraintIds.length > 0) {
    solveState = "conflicting";
  } else if (dof < 0) {
    solveState = "overdefined";
  } else if (dof === 0) {
    solveState = "well-defined";
  } else {
    solveState = "underdefined";
  }

  return {
    dof,
    removedDof,
    freePointCount,
    lockedPointCount,
    solveState,
    issues,
    conflictingConstraintIds,
  };
}

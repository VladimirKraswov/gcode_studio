import { Equations } from "./equations";
import type { SketchPoint, SketchConstraint } from "../types";

const MAX_ITERATIONS = 50;
const TOLERANCE = 1e-6;
const EPS = 1e-8;

export function solveConstraints(
  points: SketchPoint[],
  constraints: SketchConstraint[]
): SketchPoint[] {
  let currentPoints = points.map(p => ({ ...p }));

  // Identify free variables (points that are not fixed)
  const freePoints = currentPoints.filter(p => !p.isFixed);
  if (freePoints.length === 0 || constraints.length === 0) return currentPoints;

  const variables: { pointId: string, axis: 'x' | 'y' }[] = [];
  freePoints.forEach(p => {
    variables.push({ pointId: p.id, axis: 'x' });
    variables.push({ pointId: p.id, axis: 'y' });
  });

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const residuals = computeAllResiduals(currentPoints, constraints);
    const error = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0));

    if (error < TOLERANCE) break;

    const J = computeJacobian(currentPoints, constraints, variables);
    const delta = solveLinearSystem(J, residuals);

    // Apply delta
    for (let i = 0; i < variables.length; i++) {
      const v = variables[i];
      const p = currentPoints.find(pt => pt.id === v.pointId)!;
      if (v.axis === 'x') p.x -= delta[i];
      else p.y -= delta[i];
    }
  }

  return currentPoints;
}

function computeAllResiduals(points: SketchPoint[], constraints: SketchConstraint[]): number[] {
  const residuals: number[] = [];
  const pointMap = new Map(points.map(p => [p.id, p]));

  for (const c of constraints) {
    if (!c.enabled) continue;
    const pts = c.pointIds.map(id => pointMap.get(id)!);

    switch (c.type) {
      case "coincident":
        residuals.push(Equations.coincidentX(pts[0], pts[1]));
        residuals.push(Equations.coincidentY(pts[0], pts[1]));
        break;
      case "horizontal":
        residuals.push(Equations.horizontal(pts[0], pts[1]));
        break;
      case "vertical":
        residuals.push(Equations.vertical(pts[0], pts[1]));
        break;
      case "distance":
        residuals.push(Equations.distance(pts[0], pts[1], c.value ?? 0));
        break;
      case "parallel":
        residuals.push(Equations.parallel(pts[0], pts[1], pts[2], pts[3]));
        break;
      case "perpendicular":
        residuals.push(Equations.perpendicular(pts[0], pts[1], pts[2], pts[3]));
        break;
    }
  }
  return residuals;
}

function computeJacobian(
  points: SketchPoint[],
  constraints: SketchConstraint[],
  variables: { pointId: string, axis: 'x' | 'y' }[]
): number[][] {
  const residuals0 = computeAllResiduals(points, constraints);
  const J: number[][] = [];

  for (let j = 0; j < variables.length; j++) {
    const v = variables[j];
    const originalPoints = points.map(p => ({ ...p }));
    const p = points.find(pt => pt.id === v.pointId)!;

    if (v.axis === 'x') p.x += EPS;
    else p.y += EPS;

    const residuals1 = computeAllResiduals(points, constraints);

    // Restore
    const pRestore = points.find(pt => pt.id === v.pointId)!;
    if (v.axis === 'x') pRestore.x -= EPS;
    else pRestore.y -= EPS;

    for (let i = 0; i < residuals0.length; i++) {
      if (!J[i]) J[i] = [];
      J[i][j] = (residuals1[i] - residuals0[i]) / EPS;
    }
  }
  return J;
}

/**
 * Solves J * delta = residuals using Least Squares (J^T * J * delta = J^T * residuals)
 * for over-determined or under-determined systems.
 */
function solveLinearSystem(J: number[][], residuals: number[]): number[] {
  const rows = J.length;
  if (rows === 0) return [];
  const cols = J[0].length;

  // A = J^T * J
  const A: number[][] = Array.from({ length: cols }, () => new Array(cols).fill(0));
  const b: number[] = new Array(cols).fill(0);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < rows; k++) {
        A[i][j] += J[k][i] * J[k][j];
      }
    }
    for (let k = 0; k < rows; k++) {
      b[i] += J[k][i] * residuals[k];
    }
  }

  // Add regularization for stability
  for (let i = 0; i < cols; i++) A[i][i] += 1e-6;

  return gaussianElimination(A, b);
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[max][i])) max = k;
    }
    [A[i], A[max]] = [A[max], A[i]];
    [b[i], b[max]] = [b[max], b[i]];

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      b[k] -= factor * b[i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
}

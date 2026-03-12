import { computeResiduals } from "./equations";
import type { SketchPoint, SketchConstraint, SketchShape } from "../types";

const MAX_ITERATIONS = 50;
const TOLERANCE = 1e-6;
const EPS = 1e-8;
const INITIAL_LAMBDA = 1e-3;

export function solveConstraints(
  points: SketchPoint[],
  constraints: SketchConstraint[],
  shapes: SketchShape[] = [],
): SketchPoint[] {
  let currentPoints = points.map((p) => ({ ...p }));

  const freePoints = currentPoints.filter((p) => !p.isFixed);
  if (freePoints.length === 0 || constraints.length === 0) return currentPoints;

  const variables: { pointId: string; axis: "x" | "y" }[] = [];
  freePoints.forEach((p) => {
    variables.push({ pointId: p.id, axis: "x" });
    variables.push({ pointId: p.id, axis: "y" });
  });

  let lambda = INITIAL_LAMBDA;
  let prevError = Infinity;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const residuals = computeAllResiduals(currentPoints, constraints, shapes);
    const error = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / (residuals.length || 1));

    if (error < TOLERANCE) break;

    const J = computeJacobian(currentPoints, constraints, shapes, variables);

    // Levenberg-Marquardt step
    let delta: number[] = [];
    let success = false;

    // Try to solve with current lambda
    for(let lmIter = 0; lmIter < 5; lmIter++) {
        delta = solveLinearSystemLM(J, residuals, lambda);

        const nextPoints = currentPoints.map(p => ({...p}));
        for (let i = 0; i < variables.length; i++) {
            const v = variables[i];
            const p = nextPoints.find((pt) => pt.id === v.pointId);
            if (!p || !Number.isFinite(delta[i])) continue;
            if (v.axis === "x") p.x -= delta[i];
            else p.y -= delta[i];
        }

        const nextResiduals = computeAllResiduals(nextPoints, constraints, shapes);
        const nextError = Math.sqrt(nextResiduals.reduce((sum, r) => sum + r * r, 0) / (nextResiduals.length || 1));

        if (nextError < error) {
            currentPoints = nextPoints;
            lambda /= 10;
            success = true;
            break;
        } else {
            lambda *= 10;
        }
    }

    if (!success) {
        // If we couldn't improve error, try one normal step or stop
        const deltaNormal = solveLinearSystemLM(J, residuals, 1e-6);
        for (let i = 0; i < variables.length; i++) {
            const v = variables[i];
            const p = currentPoints.find((pt) => pt.id === v.pointId);
            if (!p || !Number.isFinite(deltaNormal[i])) continue;
            if (v.axis === "x") p.x -= deltaNormal[i];
            else p.y -= deltaNormal[i];
        }
    }

    if (Math.abs(prevError - error) < TOLERANCE * 0.1) break;
    prevError = error;
  }

  return currentPoints;
}

function computeAllResiduals(
  points: SketchPoint[],
  constraints: SketchConstraint[],
  shapes: SketchShape[],
): number[] {
  const residuals: number[] = [];
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const shapeMap = new Map(shapes.map((shape) => [shape.id, shape]));

  for (const c of constraints) {
    const res = computeResiduals(c, pointMap, shapeMap);
    residuals.push(...res);
  }

  return residuals;
}

function computeJacobian(
  points: SketchPoint[],
  constraints: SketchConstraint[],
  shapes: SketchShape[],
  variables: { pointId: string; axis: "x" | "y" }[],
): number[][] {
  const residuals0 = computeAllResiduals(points, constraints, shapes);
  const J: number[][] = [];

  for (let j = 0; j < variables.length; j++) {
    const v = variables[j];
    const p = points.find((pt) => pt.id === v.pointId);
    if (!p) continue;

    const originalValue = v.axis === "x" ? p.x : p.y;
    if (v.axis === "x") p.x += EPS;
    else p.y += EPS;

    const residuals1 = computeAllResiduals(points, constraints, shapes);

    if (v.axis === "x") p.x = originalValue;
    else p.y = originalValue;

    for (let i = 0; i < residuals0.length; i++) {
      if (!J[i]) J[i] = [];
      J[i][j] = (residuals1[i] - residuals0[i]) / EPS;
    }
  }

  return J;
}

function solveLinearSystemLM(J: number[][], residuals: number[], lambda: number): number[] {
  const rows = J.length;
  if (rows === 0) return [];
  const cols = J[0]?.length ?? 0;
  if (cols === 0) return [];

  const A: number[][] = Array.from({ length: cols }, () => new Array(cols).fill(0));
  const b: number[] = new Array(cols).fill(0);

  // Normal equations: (J^T * J + lambda * I) * delta = J^T * residuals
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < rows; k++) {
        A[i][j] += (J[k]?.[i] ?? 0) * (J[k]?.[j] ?? 0);
      }
    }
    for (let k = 0; k < rows; k++) {
      b[i] += (J[k]?.[i] ?? 0) * residuals[k];
    }
  }

  for (let i = 0; i < cols; i++) {
      A[i][i] += lambda;
  }

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

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-15) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / pivot;
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

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-15) {
      x[i] = 0;
      continue;
    }

    x[i] = (b[i] - sum) / pivot;
  }

  return x;
}

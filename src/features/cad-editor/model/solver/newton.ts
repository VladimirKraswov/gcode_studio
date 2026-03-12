import { Equations } from "./equations";
import type { SketchPoint, SketchConstraint, SketchShape } from "../types";
import { getConstraintPointIds, getConstraintShapeIds } from "../constraints";

const MAX_ITERATIONS = 50;
const TOLERANCE = 1e-6;
const EPS = 1e-8;

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

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const residuals = computeAllResiduals(currentPoints, constraints, shapes);
    const error = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0));

    if (error < TOLERANCE) break;

    const J = computeJacobian(currentPoints, constraints, shapes, variables);
    const delta = solveLinearSystem(J, residuals);

    for (let i = 0; i < variables.length; i++) {
      const v = variables[i];
      const p = currentPoints.find((pt) => pt.id === v.pointId);
      if (!p || !Number.isFinite(delta[i])) continue;
      if (v.axis === "x") p.x -= delta[i];
      else p.y -= delta[i];
    }
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
    if (!c.enabled) continue;

    const pointIds = getConstraintPointIds(c);
    const shapeIds = getConstraintShapeIds(c);
    const pts = pointIds.map((id) => pointMap.get(id)).filter(Boolean) as SketchPoint[];

    switch (c.type) {
      case "coincident":
        if (pts.length >= 2) {
          residuals.push(Equations.coincidentX(pts[0], pts[1]));
          residuals.push(Equations.coincidentY(pts[0], pts[1]));
        }
        break;

      case "horizontal":
        if (pts.length >= 2) residuals.push(Equations.horizontal(pts[0], pts[1]));
        break;

      case "vertical":
        if (pts.length >= 2) residuals.push(Equations.vertical(pts[0], pts[1]));
        break;

      case "distance":
        if (pts.length >= 2) residuals.push(Equations.distance(pts[0], pts[1], c.value ?? 0));
        break;

      case "parallel":
        if (pts.length >= 4) residuals.push(Equations.parallel(pts[0], pts[1], pts[2], pts[3]));
        break;

      case "perpendicular":
        if (pts.length >= 4) residuals.push(Equations.perpendicular(pts[0], pts[1], pts[2], pts[3]));
        break;

      case "distance-x":
        if (pts.length >= 2) residuals.push(Equations.distanceX(pts[0], pts[1], c.value ?? 0));
        break;

      case "distance-y":
        if (pts.length >= 2) residuals.push(Equations.distanceY(pts[0], pts[1], c.value ?? 0));
        break;

      case "equal":
        if (pts.length >= 4) residuals.push(Equations.equal(pts[0], pts[1], pts[2], pts[3]));
        break;

      case "tangent":
        if (pts.length >= 3) residuals.push(Equations.tangent(pts[0], c.value ?? 0, pts[1], pts[2]));
        break;

      case "symmetric":
        if (pts.length >= 4) residuals.push(Equations.symmetry(pts[0], pts[1], pts[2], pts[3]));
        break;

      case "angle":
        if (pts.length >= 4) residuals.push(Equations.angle(pts[0], pts[1], pts[2], pts[3], c.value ?? 0));
        break;

      case "radius":
        if (pts.length >= 2) residuals.push(Equations.radius(pts[0], pts[1], c.value ?? 0));
        break;

      case "midpoint":
        if (pts.length >= 3) {
          residuals.push(Equations.midpointX(pts[0], pts[1], pts[2]));
          residuals.push(Equations.midpointY(pts[0], pts[1], pts[2]));
        }
        break;

      case "point-on-object": {
        if (pts.length < 1 || shapeIds.length < 1) break;
        const shape = shapeMap.get(shapeIds[0]);
        if (!shape) break;

        if (shape.type === "line") {
          const a = pointMap.get(shape.p1);
          const b = pointMap.get(shape.p2);
          if (!a || !b) break;
          residuals.push(Equations.pointOnLine(pts[0], a, b));
        } else if (shape.type === "circle" || shape.type === "arc") {
          const center = pointMap.get(shape.center);
          if (!center) break;
          residuals.push(Equations.pointOnCircle(pts[0], center, shape.radius));
        }
        break;
      }

      default:
        break;
    }
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

    if (v.axis === "x") p.x += EPS;
    else p.y += EPS;

    const residuals1 = computeAllResiduals(points, constraints, shapes);

    if (v.axis === "x") p.x -= EPS;
    else p.y -= EPS;

    for (let i = 0; i < residuals0.length; i++) {
      if (!J[i]) J[i] = [];
      J[i][j] = (residuals1[i] - residuals0[i]) / EPS;
    }
  }

  return J;
}

function solveLinearSystem(J: number[][], residuals: number[]): number[] {
  const rows = J.length;
  if (rows === 0) return [];
  const cols = J[0]?.length ?? 0;
  if (cols === 0) return [];

  const A: number[][] = Array.from({ length: cols }, () => new Array(cols).fill(0));
  const b: number[] = new Array(cols).fill(0);

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

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-12) continue;

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
    if (Math.abs(pivot) < 1e-12) {
      x[i] = 0;
      continue;
    }

    x[i] = (b[i] - sum) / pivot;
  }

  return x;
}
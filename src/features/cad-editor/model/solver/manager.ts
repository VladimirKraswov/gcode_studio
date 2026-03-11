import { solveConstraints } from "./newton";
import type { SketchDocument, SketchPoint } from "../types";

export function updateGeometry(document: SketchDocument): SketchDocument {
  const solvedPoints = solveConstraints(document.points, document.constraints);

  return {
    ...document,
    points: solvedPoints,
  };
}

/**
 * Updates a subset of points and then solves the constraint system.
 */
export function movePointsAndSolve(
  document: SketchDocument,
  pointIds: Set<string>,
  dx: number,
  dy: number
): SketchDocument {
  const nextPoints = document.points.map(p =>
    pointIds.has(p.id) ? { ...p, x: p.x + dx, y: p.y + dy } : p
  );

  const solvedPoints = solveConstraints(nextPoints, document.constraints);

  return {
    ...document,
    points: solvedPoints,
  };
}

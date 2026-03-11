import { solveConstraints } from "./newton";
import type { SketchDocument } from "../types";

export function updateGeometry(document: SketchDocument): SketchDocument {
  const solvedPoints = solveConstraints(document.points, document.constraints);
  return {
    ...document,
    points: solvedPoints,
  };
}

export function movePointsAndSolve(
  document: SketchDocument,
  pointIds: Set<string>,
  dx: number,
  dy: number
): SketchDocument {
  if (pointIds.size === 0) return document;

  const nextPoints = document.points.map(p => {
    if (pointIds.has(p.id)) {
      return { ...p, x: p.x + dx, y: p.y + dy };
    }
    return p;
  });

  // If a point is fixed, we should probably not allow it to move,
  // or use its movement to shift other things?
  // In most CAD, dragging a fixed point does nothing.

  const solvedPoints = solveConstraints(nextPoints, document.constraints);

  return {
    ...document,
    points: solvedPoints,
  };
}

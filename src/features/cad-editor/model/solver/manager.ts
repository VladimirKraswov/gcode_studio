import { solveConstraints } from "./newton";
import type { SketchDocument } from "../types";

export function updateGeometry(document: SketchDocument): SketchDocument {
  const solvedPoints = solveConstraints(
    document.points,
    document.constraints,
    document.shapes,
  );

  return {
    ...document,
    points: solvedPoints,
  };
}

export function movePointsAndSolve(
  document: SketchDocument,
  pointIds: Set<string>,
  dx: number,
  dy: number,
): SketchDocument {
  if (pointIds.size === 0) return document;

  const nextPoints = document.points.map((p) => {
    if (pointIds.has(p.id) && !p.isFixed) {
      return { ...p, x: p.x + dx, y: p.y + dy };
    }
    return p;
  });

  const solvedPoints = solveConstraints(
    nextPoints,
    document.constraints,
    document.shapes,
  );

  return {
    ...document,
    points: solvedPoints,
  };
}
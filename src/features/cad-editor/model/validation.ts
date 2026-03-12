import type { SketchDocument } from "./types";
import { getConstraintPointIds } from "./constraints";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateSketch(document: SketchDocument): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  document.shapes.forEach(shape => {
    if (shape.type === "polyline" && shape.closed) {
      if (!isContourClosed(shape)) {
        result.errors.push(`Shape "${shape.name}" is marked as closed but its contour is open.`);
        result.isValid = false;
      }
    }
  });

  const pointDegrees = new Map<string, number>();
  document.constraints.forEach(c => {
    getConstraintPointIds(c).forEach(id => {
      pointDegrees.set(id, (pointDegrees.get(id) || 0) + 1);
    });
  });

  return result;
}

function isContourClosed(shape: any): boolean {
  if (shape.type === "polyline") {
    const pointIds = shape.pointIds;
    if (pointIds.length < 2) return false;
    return pointIds[0] === pointIds[pointIds.length - 1];
  }
  return true;
}
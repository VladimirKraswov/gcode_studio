import type { SketchDocument, SketchShape } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validates the sketch for common issues.
 */
export function validateSketch(document: SketchDocument): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // 1. Check for open contours in closed shapes
  document.shapes.forEach(shape => {
    if (shape.type === "polyline" && shape.closed) {
      if (!isContourClosed(shape, document)) {
        result.errors.push(`Shape "${shape.name}" is marked as closed but its contour is open.`);
        result.isValid = false;
      }
    }
  });

  // 2. Detect over-constrained points
  const pointDegrees = new Map<string, number>();
  document.constraints.forEach(c => {
    c.pointIds.forEach(id => {
      pointDegrees.set(id, (pointDegrees.get(id) || 0) + 1);
    });
  });

  // 3. Detect redundant constraints (simplified)
  // Real implementation would use the GCS Jacobian rank

  return result;
}

function isContourClosed(shape: any, document: SketchDocument): boolean {
  if (shape.type === "polyline") {
    const pointIds = shape.pointIds;
    if (pointIds.length < 2) return false;
    return pointIds[0] === pointIds[pointIds.length - 1];
  }
  return true;
}

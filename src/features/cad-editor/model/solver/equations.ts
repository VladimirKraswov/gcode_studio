import type { SketchPoint, SketchConstraint, SketchParameter } from "../types";

export type Variable = {
  pointId: string;
  axis: "x" | "y";
};

/**
 * Computes the residual (f(x)) for various constraint types.
 */
export function computeResidual(
  constraint: SketchConstraint,
  points: Map<string, SketchPoint>,
  parameters: Map<string, SketchParameter>
): number {
  switch (constraint.type) {
    case "coincident": {
      const p1 = points.get(constraint.pointIds[0]);
      const p2 = points.get(constraint.pointIds[1]);
      if (!p1 || !p2) return 0;
      // We return two residuals usually for coincidence, but for simplicity here we handle one at a time
      // This function might need to be split into multiple equations per constraint
      return 0; // Handled by specialized calls
    }
    case "horizontal": {
      const p1 = points.get(constraint.pointIds[0]);
      const p2 = points.get(constraint.pointIds[1]);
      if (!p1 || !p2) return 0;
      return p1.y - p2.y;
    }
    case "vertical": {
      const p1 = points.get(constraint.pointIds[0]);
      const p2 = points.get(constraint.pointIds[1]);
      if (!p1 || !p2) return 0;
      return p1.x - p2.x;
    }
    case "distance": {
      const p1 = points.get(constraint.pointIds[0]);
      const p2 = points.get(constraint.pointIds[1]);
      if (!p1 || !p2) return 0;
      const targetDist = constraint.value ?? 0;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy) - targetDist;
    }
    // ... more equations
    default:
      return 0;
  }
}

/**
 * Specialized residual functions for each DOF a constraint removes.
 */
export const Equations = {
  coincidentX: (p1: SketchPoint, p2: SketchPoint) => p1.x - p2.x,
  coincidentY: (p1: SketchPoint, p2: SketchPoint) => p1.y - p2.y,
  horizontal: (p1: SketchPoint, p2: SketchPoint) => p1.y - p2.y,
  vertical: (p1: SketchPoint, p2: SketchPoint) => p1.x - p2.x,
  distance: (p1: SketchPoint, p2: SketchPoint, dist: number) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy + 1e-9) - dist;
  },
  distanceX: (p1: SketchPoint, p2: SketchPoint, dist: number) => (p1.x - p2.x) - dist,
  distanceY: (p1: SketchPoint, p2: SketchPoint, dist: number) => (p1.y - p2.y) - dist,
  perpendicular: (p1: SketchPoint, p2: SketchPoint, p3: SketchPoint, p4: SketchPoint) => {
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    return v1x * v2x + v1y * v2y; // Dot product = 0
  },
  parallel: (p1: SketchPoint, p2: SketchPoint, p3: SketchPoint, p4: SketchPoint) => {
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    return v1x * v2y - v1y * v2x; // Cross product = 0
  }
};

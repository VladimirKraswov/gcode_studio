import type {
  SketchPoint,
  SketchConstraint,
  SketchParameter,
  SketchShape,
} from "../types";
import { getConstraintPointIds, getConstraintShapeIds } from "../constraints";

export type Variable = {
  pointId: string;
  axis: "x" | "y";
};

function pointToLineResidual(
  p: SketchPoint,
  a: SketchPoint,
  b: SketchPoint,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy + 1e-9);
  return ((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function pointToSegmentResidual(
  p: SketchPoint,
  a: SketchPoint,
  b: SketchPoint,
): number {
  return pointToLineResidual(p, a, b);
}

function pointToCircleResidual(
  p: SketchPoint,
  center: SketchPoint,
  radius: number,
): number {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return Math.sqrt(dx * dx + dy * dy + 1e-9) - radius;
}

export function computeResidual(
  constraint: SketchConstraint,
  points: Map<string, SketchPoint>,
  _parameters: Map<string, SketchParameter>,
  shapes: Map<string, SketchShape>,
): number {
  const pointIds = getConstraintPointIds(constraint);
  const shapeIds = getConstraintShapeIds(constraint);

  switch (constraint.type) {
    case "horizontal": {
      const p1 = points.get(pointIds[0]);
      const p2 = points.get(pointIds[1]);
      if (!p1 || !p2) return 0;
      return p1.y - p2.y;
    }

    case "vertical": {
      const p1 = points.get(pointIds[0]);
      const p2 = points.get(pointIds[1]);
      if (!p1 || !p2) return 0;
      return p1.x - p2.x;
    }

    case "distance": {
      const p1 = points.get(pointIds[0]);
      const p2 = points.get(pointIds[1]);
      if (!p1 || !p2) return 0;
      const targetDist = constraint.value ?? 0;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy) - targetDist;
    }

    case "point-on-object": {
      const p = points.get(pointIds[0]);
      const shape = shapes.get(shapeIds[0]);
      if (!p || !shape) return 0;

      if (shape.type === "line") {
        const a = points.get(shape.p1);
        const b = points.get(shape.p2);
        if (!a || !b) return 0;
        return pointToSegmentResidual(p, a, b);
      }

      if (shape.type === "circle" || shape.type === "arc") {
        const center = points.get(shape.center);
        if (!center) return 0;
        return pointToCircleResidual(p, center, shape.radius);
      }

      return 0;
    }

    default:
      return 0;
  }
}

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
  distanceX: (p1: SketchPoint, p2: SketchPoint, dist: number) =>
    (p1.x - p2.x) - dist,
  distanceY: (p1: SketchPoint, p2: SketchPoint, dist: number) =>
    (p1.y - p2.y) - dist,
  perpendicular: (
    p1: SketchPoint,
    p2: SketchPoint,
    p3: SketchPoint,
    p4: SketchPoint,
  ) => {
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    return v1x * v2x + v1y * v2y;
  },
  parallel: (
    p1: SketchPoint,
    p2: SketchPoint,
    p3: SketchPoint,
    p4: SketchPoint,
  ) => {
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    return v1x * v2y - v1y * v2x;
  },
  equal: (
    p1: SketchPoint,
    p2: SketchPoint,
    p3: SketchPoint,
    p4: SketchPoint,
  ) => {
    const d1 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const d2 = Math.sqrt((p4.x - p3.x) ** 2 + (p4.y - p3.y) ** 2);
    return d1 - d2;
  },
  tangent: (
    center: SketchPoint,
    radius: number,
    p1: SketchPoint,
    p2: SketchPoint,
  ) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy + 1e-9);
    const area = Math.abs(
      (p2.x - p1.x) * (p1.y - center.y) -
      (p1.x - center.x) * (p2.y - p1.y),
    );
    const dist = area / length;
    return dist - radius;
  },
  symmetry: (
    p1: SketchPoint,
    p2: SketchPoint,
    sym1: SketchPoint,
    sym2: SketchPoint,
  ) => {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = sym2.x - sym1.x;
    const dy = sym2.y - sym1.y;
    const length = Math.sqrt(dx * dx + dy * dy + 1e-9);
    const area =
      (sym2.x - sym1.x) * (sym1.y - my) -
      (sym1.x - mx) * (sym2.y - dy);
    return area / length;
  },
  angle: (
    p1: SketchPoint,
    p2: SketchPoint,
    p3: SketchPoint,
    p4: SketchPoint,
    targetAngleDeg: number,
  ) => {
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    const dot = v1x * v2x + v1y * v2y;
    const cross = v1x * v2y - v1y * v2x;
    const angle = Math.atan2(cross, dot);
    return angle - (targetAngleDeg * Math.PI) / 180;
  },
  radius: (center: SketchPoint, p: SketchPoint, targetRadius: number) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return Math.sqrt(dx * dx + dy * dy + 1e-9) - targetRadius;
  },
  midpointX: (p: SketchPoint, a: SketchPoint, b: SketchPoint) =>
    p.x - (a.x + b.x) / 2,
  midpointY: (p: SketchPoint, a: SketchPoint, b: SketchPoint) =>
    p.y - (a.y + b.y) / 2,
  pointOnLine: (p: SketchPoint, a: SketchPoint, b: SketchPoint) =>
    pointToLineResidual(p, a, b),
  pointOnCircle: (p: SketchPoint, center: SketchPoint, radius: number) =>
    pointToCircleResidual(p, center, radius),
};
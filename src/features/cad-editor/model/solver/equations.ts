import type {
  SketchPoint,
  SketchConstraint,
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
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return 0;
  const len = Math.sqrt(lenSq);
  // Cross product / length = distance
  return ((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function pointToCircleResidual(
  p: SketchPoint,
  center: SketchPoint,
  radius: number,
): number {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return Math.sqrt(dx * dx + dy * dy + 1e-12) - radius;
}

export function computeResiduals(
  constraint: SketchConstraint,
  pointMap: Map<string, SketchPoint>,
  shapeMap: Map<string, SketchShape>,
): number[] {
  if (!constraint.enabled) return [];

  const pointIds = getConstraintPointIds(constraint);
  const shapeIds = getConstraintShapeIds(constraint);
  const pts = pointIds.map((id) => pointMap.get(id)).filter(Boolean) as SketchPoint[];
  const value = constraint.value ?? 0;

  switch (constraint.type) {
    case "coincident":
      if (pts.length >= 2) {
        return [
          Equations.coincidentX(pts[0], pts[1]),
          Equations.coincidentY(pts[0], pts[1]),
        ];
      }
      break;

    case "horizontal":
      if (pts.length >= 2) return [Equations.horizontal(pts[0], pts[1])];
      break;

    case "vertical":
      if (pts.length >= 2) return [Equations.vertical(pts[0], pts[1])];
      break;

    case "distance":
      if (pts.length >= 2) return [Equations.distance(pts[0], pts[1], value)];
      break;

    case "parallel":
      if (pts.length >= 4) return [Equations.parallel(pts[0], pts[1], pts[2], pts[3])];
      break;

    case "perpendicular":
      if (pts.length >= 4) return [Equations.perpendicular(pts[0], pts[1], pts[2], pts[3])];
      break;

    case "distance-x":
      if (pts.length >= 2) return [Equations.distanceX(pts[0], pts[1], value)];
      break;

    case "distance-y":
      if (pts.length >= 2) return [Equations.distanceY(pts[0], pts[1], value)];
      break;

    case "equal":
      if (pts.length >= 4) return [Equations.equal(pts[0], pts[1], pts[2], pts[3])];
      break;

    case "tangent":
      if (pts.length >= 3) return [Equations.tangent(pts[0], value, pts[1], pts[2])];
      break;

    case "symmetric":
      if (pts.length >= 4) {
        // Symmetry removes 2 DOFs:
        // 1. Midpoint of (p1, p2) must lie on the symmetry line (sym1, sym2)
        // 2. Vector (p1, p2) must be perpendicular to the symmetry line (sym1, sym2)
        return [
          Equations.symmetry(pts[0], pts[1], pts[2], pts[3]),
          Equations.perpendicular(pts[0], pts[1], pts[2], pts[3]),
        ];
      }
      break;

    case "angle":
      if (pts.length >= 4) return [Equations.angle(pts[0], pts[1], pts[2], pts[3], value)];
      break;

    case "radius":
      if (pts.length >= 2) return [Equations.radius(pts[0], pts[1], value)];
      break;

    case "diameter":
        if (pts.length >= 2) return [Equations.radius(pts[0], pts[1], value / 2)];
        break;

    case "midpoint":
      if (pts.length >= 3) {
        return [
          Equations.midpointX(pts[0], pts[1], pts[2]),
          Equations.midpointY(pts[0], pts[1], pts[2]),
        ];
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
        return [Equations.pointOnLine(pts[0], a, b)];
      } else if (shape.type === "circle" || shape.type === "arc") {
        const center = pointMap.get(shape.center);
        if (!center) break;
        return [Equations.pointOnCircle(pts[0], center, shape.radius)];
      }
      break;
    }

    case "collinear":
        if (pts.length >= 4) {
            return [
                Equations.pointOnLine(pts[2], pts[0], pts[1]),
                Equations.pointOnLine(pts[3], pts[0], pts[1]),
            ];
        }
        break;

    case "lock":
      if (pts.length >= 1) {
        // value is not used, we assume we want to fix point at its current position
        // In a real CAD, 'lock' might store the target X, Y.
        // If we don't have them, we might use the point's current X, Y as targets.
        // But the solver changes points. So we need the target position.
        // Let's assume for now that if value is not provided, we don't do anything here
        // and rely on isFixed property. But if we want it as a constraint:
        if (constraint.labelX !== undefined && constraint.labelY !== undefined) {
             return [
                 pts[0].x - constraint.labelX,
                 pts[0].y - constraint.labelY
             ];
        }
      }
      break;

    default:
      break;
  }

  return [];
}

export const Equations = {
  coincidentX: (p1: SketchPoint, p2: SketchPoint) => p1.x - p2.x,
  coincidentY: (p1: SketchPoint, p2: SketchPoint) => p1.y - p2.y,
  horizontal: (p1: SketchPoint, p2: SketchPoint) => p1.y - p2.y,
  vertical: (p1: SketchPoint, p2: SketchPoint) => p1.x - p2.x,
  distance: (p1: SketchPoint, p2: SketchPoint, dist: number) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy + 1e-12) - dist;
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
    const d1 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + 1e-12);
    const d2 = Math.sqrt((p4.x - p3.x) ** 2 + (p4.y - p3.y) ** 2 + 1e-12);
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
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < 1e-12) return 0;
    const length = Math.sqrt(lengthSq);
    // signed distance from point to line: ((x2-x1)(y1-y0) - (x1-x0)(y2-y1)) / L
    const dist = ((p2.x - p1.x) * (p1.y - center.y) - (p1.x - center.x) * (p2.y - p1.y)) / length;
    // We want the absolute distance to be equal to radius.
    // To avoid issues with Math.abs in Newton solver (not differentiable at 0),
    // we can use dist^2 = radius^2 or carefully choose sign.
    // If we use dist^2 - radius^2, the derivative is 2*dist*dist'.
    // Another way: use (dist - radius) or (dist + radius) depending on which is closer.
    if (Math.abs(dist - radius) < Math.abs(dist + radius)) {
        return dist - radius;
    } else {
        return dist + radius;
    }
  },
  symmetry: (
    p1: SketchPoint,
    p2: SketchPoint,
    sym1: SketchPoint,
    sym2: SketchPoint,
  ) => {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    return pointToLineResidual({ x: mx, y: my } as any, sym1, sym2);
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
    return Math.sqrt(dx * dx + dy * dy + 1e-12) - targetRadius;
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

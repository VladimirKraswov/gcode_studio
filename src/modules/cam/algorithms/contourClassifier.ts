import type { CadPoint } from "../../cad/geometry/textGeometry";

export type ClassifiedContours = {
  external: CadPoint[][];
  holes: Map<number, number[]>;
  parent: number[];
  depth: number[];
};

const EPS = 1e-9;

function signedArea(polygon: CadPoint[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function areaAbs(polygon: CadPoint[]): number {
  return Math.abs(signedArea(polygon));
}

function boundsOf(polygon: CadPoint[]) {
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function boundsContains(outer: ReturnType<typeof boundsOf>, inner: ReturnType<typeof boundsOf>): boolean {
  return (
    inner.minX >= outer.minX - EPS &&
    inner.maxX <= outer.maxX + EPS &&
    inner.minY >= outer.minY - EPS &&
    inner.maxY <= outer.maxY + EPS
  );
}

function contourSamplePoint(contour: CadPoint[]): CadPoint {
  return contour[0] ?? { x: 0, y: 0 };
}

export function pointInPolygon(point: CadPoint, polygon: CadPoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];

    const onSegment =
      Math.abs((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) < EPS &&
      point.x >= Math.min(a.x, b.x) - EPS &&
      point.x <= Math.max(a.x, b.x) + EPS &&
      point.y >= Math.min(a.y, b.y) - EPS &&
      point.y <= Math.max(a.y, b.y) + EPS;
    if (onSegment) return true;

    const intersects =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + EPS) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function classifyContours(polylines: CadPoint[][]): ClassifiedContours {
  const n = polylines.length;
  const bounds = polylines.map(boundsOf);
  const areas = polylines.map(areaAbs);
  const parent = new Array<number>(n).fill(-1);
  const depth = new Array<number>(n).fill(0);

  for (let child = 0; child < n; child++) {
    let bestParent = -1;
    let bestParentArea = Infinity;
    const probe = contourSamplePoint(polylines[child]);

    for (let candidate = 0; candidate < n; candidate++) {
      if (candidate === child) continue;
      if (areas[candidate] <= areas[child] + EPS) continue;
      if (!boundsContains(bounds[candidate], bounds[child])) continue;
      if (!pointInPolygon(probe, polylines[candidate])) continue;
      if (areas[candidate] < bestParentArea) {
        bestParentArea = areas[candidate];
        bestParent = candidate;
      }
    }
    parent[child] = bestParent;
  }

  function computeDepth(index: number): number {
    if (parent[index] === -1) return 0;
    if (depth[index] > 0) return depth[index];
    depth[index] = computeDepth(parent[index]) + 1;
    return depth[index];
  }

  for (let i = 0; i < n; i++) depth[i] = computeDepth(i);

  const externalIndices = polylines.map((_, i) => i).filter(i => depth[i] % 2 === 0);
  const external = externalIndices.map(i => polylines[i]);
  const holes = new Map<number, number[]>();
  externalIndices.forEach((_, extIndex) => holes.set(extIndex, []));

  for (let i = 0; i < n; i++) {
    if (depth[i] % 2 === 1) {
      let owner = parent[i];
      while (owner !== -1 && depth[owner] % 2 === 1) owner = parent[owner];
      if (owner !== -1) {
        const extIndex = externalIndices.indexOf(owner);
        if (extIndex >= 0) holes.get(extIndex)?.push(i);
      }
    }
  }

  return { external, holes, parent, depth };
}
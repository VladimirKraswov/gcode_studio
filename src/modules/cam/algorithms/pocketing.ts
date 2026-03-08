import type { CadPoint } from "../../cad/geometry/textGeometry";

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function rotate(point: CadPoint, angleDeg: number): CadPoint {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

function rotateAround(point: CadPoint, center: CadPoint, angleDeg: number): CadPoint {
  const translated = { x: point.x - center.x, y: point.y - center.y };
  const rotated = rotate(translated, angleDeg);
  return { x: round(rotated.x + center.x), y: round(rotated.y + center.y) };
}

function boundsOf(points: CadPoint[]) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function clipHorizontalLineWithPolygon(y: number, polygon: CadPoint[]): Array<[CadPoint, CadPoint]> {
  const intersections: number[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (Math.abs(a.y - b.y) <= EPS) continue;
    const ymin = Math.min(a.y, b.y);
    const ymax = Math.max(a.y, b.y);
    if (y < ymin || y >= ymax) continue;
    const t = (y - a.y) / (b.y - a.y);
    const x = a.x + (b.x - a.x) * t;
    intersections.push(x);
  }
  intersections.sort((a, b) => a - b);
  const result: Array<[CadPoint, CadPoint]> = [];
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const x1 = intersections[i];
    const x2 = intersections[i + 1];
    if (Math.abs(x2 - x1) > EPS) result.push([{ x: round(x1), y: round(y) }, { x: round(x2), y: round(y) }]);
  }
  return result;
}

export function generateParallelPocket(polygon: CadPoint[], step: number, angle = 0): CadPoint[][] {
  if (polygon.length < 3 || step <= EPS) return [];
  const centerBounds = boundsOf(polygon);
  const center = { x: (centerBounds.minX + centerBounds.maxX) / 2, y: (centerBounds.minY + centerBounds.maxY) / 2 };
  const rotatedPolygon = polygon.map(p => rotateAround(p, center, -angle));
  const rotatedBounds = boundsOf(rotatedPolygon);
  const rawSegments: CadPoint[][] = [];
  let flip = false;
  for (let y = rotatedBounds.minY; y <= rotatedBounds.maxY + EPS; y += step) {
    const spans = clipHorizontalLineWithPolygon(y, rotatedPolygon);
    for (const [a, b] of spans) {
      const ordered = flip ? [b, a] : [a, b];
      rawSegments.push(ordered);
      flip = !flip;
    }
  }
  return rawSegments.map(segment => segment.map(p => rotateAround(p, center, angle)));
}
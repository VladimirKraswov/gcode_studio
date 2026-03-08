import type { CadPoint } from "../../cad/geometry/textGeometry";

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function contourStart(contour: CadPoint[]): CadPoint {
  return contour[0] ?? { x: 0, y: 0 };
}

function contourEnd(contour: CadPoint[]): CadPoint {
  return contour[contour.length - 1] ?? { x: 0, y: 0 };
}

export function optimizeTravelOrder(contours: CadPoint[][], startPoint: CadPoint = { x: 0, y: 0 }): number[] {
  const n = contours.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const remaining = new Set<number>(contours.map((_, i) => i));
  const order: number[] = [];
  let current = { ...startPoint };

  while (remaining.size > 0) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (const index of remaining) {
      const contour = contours[index];
      if (contour.length === 0) continue;
      const dStart = distance(current, contourStart(contour));
      const dEnd = distance(current, contourEnd(contour));
      const d = Math.min(dStart, dEnd);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    }
    if (bestIndex === -1) break;
    order.push(bestIndex);
    remaining.delete(bestIndex);
    const chosen = contours[bestIndex];
    const dStart = distance(current, contourStart(chosen));
    const dEnd = distance(current, contourEnd(chosen));
    current = dStart <= dEnd ? contourEnd(chosen) : contourStart(chosen);
  }
  return order;
}
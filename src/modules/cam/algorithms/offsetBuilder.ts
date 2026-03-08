import type { CadPoint } from "../../cad/geometry/textGeometry";

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function signedArea(points: CadPoint[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function normalizeClosedContour(points: CadPoint[]): CadPoint[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));

  const first = points[0];
  const last = points[points.length - 1];

  if (distance(first, last) <= EPS) {
    return points.slice(0, -1).map((p) => ({ ...p }));
  }

  return points.map((p) => ({ ...p }));
}

function lineIntersection(
  a1: CadPoint,
  a2: CadPoint,
  b1: CadPoint,
  b2: CadPoint,
): CadPoint | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;

  const det = dax * dby - day * dbx;
  if (Math.abs(det) <= EPS) return null;

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const t = (dx * dby - dy * dbx) / det;

  return {
    x: round(a1.x + dax * t),
    y: round(a1.y + day * t),
  };
}

function segmentNormal(a: CadPoint, b: CadPoint, outwardSign: number): CadPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;

  return {
    x: round((outwardSign * dy) / len),
    y: round((-outwardSign * dx) / len),
  };
}

function buildShiftedLines(
  contour: CadPoint[],
  offset: number,
): Array<{ a: CadPoint; b: CadPoint }> {
  const area = signedArea(contour);
  const outwardSign = area >= 0 ? 1 : -1;

  const result: Array<{ a: CadPoint; b: CadPoint }> = [];

  for (let i = 0; i < contour.length; i += 1) {
    const a = contour[i];
    const b = contour[(i + 1) % contour.length];
    const n = segmentNormal(a, b, outwardSign);

    result.push({
      a: {
        x: round(a.x + n.x * offset),
        y: round(a.y + n.y * offset),
      },
      b: {
        x: round(b.x + n.x * offset),
        y: round(b.y + n.y * offset),
      },
    });
  }

  return result;
}

function dedupeSequential(points: CadPoint[]): CadPoint[] {
  if (points.length === 0) return [];

  const result: CadPoint[] = [points[0]];

  for (let i = 1; i < points.length; i += 1) {
    if (distance(points[i], result[result.length - 1]) > EPS) {
      result.push(points[i]);
    }
  }

  if (result.length > 2 && distance(result[0], result[result.length - 1]) <= EPS) {
    result.pop();
  }

  return result;
}

function fallbackVertexOffset(
  prev: CadPoint,
  curr: CadPoint,
  next: CadPoint,
  offset: number,
  outwardSign: number,
): CadPoint {
  const n1 = segmentNormal(prev, curr, outwardSign);
  const n2 = segmentNormal(curr, next, outwardSign);

  const nx = n1.x + n2.x;
  const ny = n1.y + n2.y;
  const len = Math.hypot(nx, ny) || 1;

  return {
    x: round(curr.x + (nx / len) * offset),
    y: round(curr.y + (ny / len) * offset),
  };
}

/**
 * Простая геометрическая эквидистанта для замкнутого полигона.
 * Работает устойчиво для большинства CAD-контуров без самопересечений.
 */
export function buildOffset(
  polyline: CadPoint[],
  offset: number,
  joinType: "round" | "miter" = "round",
): CadPoint[][] {
  void joinType;

  const contour = normalizeClosedContour(polyline);
  if (contour.length < 3 || Math.abs(offset) <= EPS) {
    return contour.length >= 3 ? [contour] : [];
  }

  const shifted = buildShiftedLines(contour, offset);
  const area = signedArea(contour);
  const outwardSign = area >= 0 ? 1 : -1;

  const points: CadPoint[] = [];

  for (let i = 0; i < contour.length; i += 1) {
    const prevLine = shifted[(i - 1 + shifted.length) % shifted.length];
    const nextLine = shifted[i];

    const intersection = lineIntersection(
      prevLine.a,
      prevLine.b,
      nextLine.a,
      nextLine.b,
    );

    if (intersection) {
      points.push(intersection);
    } else {
      const prev = contour[(i - 1 + contour.length) % contour.length];
      const curr = contour[i];
      const next = contour[(i + 1) % contour.length];

      points.push(fallbackVertexOffset(prev, curr, next, offset, outwardSign));
    }
  }

  const deduped = dedupeSequential(points);
  if (deduped.length < 3) return [];

  return [deduped];
}

function polygonAreaAbs(points: CadPoint[]): number {
  return Math.abs(signedArea(points));
}

/**
 * Строит серию эквидистант в одну сторону, пока контур не схлопнется.
 */
export function buildContourOffsets(
  polyline: CadPoint[],
  isExternal: boolean,
  step: number,
  maxOffset: number,
): CadPoint[][] {
  const result: CadPoint[][] = [];
  const base = normalizeClosedContour(polyline);

  if (base.length < 3) return [];
  if (step <= EPS || maxOffset < -EPS) return [];

  const sign = isExternal ? 1 : -1;
  const limit = Math.abs(maxOffset);

  for (let current = 0; current <= limit + EPS; current += step) {
    const amount = sign * current;
    const built = current <= EPS ? [base] : buildOffset(base, amount);

    if (built.length === 0) break;

    const main = built
      .filter((contour) => contour.length >= 3)
      .sort((a, b) => polygonAreaAbs(b) - polygonAreaAbs(a))[0];

    if (!main || polygonAreaAbs(main) <= EPS) {
      break;
    }

    result.push(main);
  }

  return result;
}
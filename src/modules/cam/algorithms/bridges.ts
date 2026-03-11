import type { CadPoint } from "@/features/cad-editor/geometry/textGeometry";

export type BridgeSpan = {
  start: number;
  end: number;
};

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeClosedContour(contour: CadPoint[]): CadPoint[] {
  if (contour.length < 2) return contour.map((p) => ({ ...p }));
  const first = contour[0];
  const last = contour[contour.length - 1];
  if (distance(first, last) <= EPS) {
    return contour.slice(0, -1).map((p) => ({ ...p }));
  }
  return contour.map((p) => ({ ...p }));
}

export function contourLength(contour: CadPoint[]): number {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < normalized.length; i++) {
    total += distance(normalized[i], normalized[(i + 1) % normalized.length]);
  }
  return total;
}

export function buildBridgeSpans(
  contour: CadPoint[],
  bridgeCount: number,
  bridgeWidth: number
): BridgeSpan[] {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length < 3) return [];
  if (bridgeCount <= 0 || bridgeWidth <= 0) return [];

  const total = contourLength(normalized);
  if (total <= EPS) return [];

  const width = Math.min(Math.max(bridgeWidth, 0), total * 0.8);
  const spacing = total / bridgeCount;

  const raw: BridgeSpan[] = [];
  for (let i = 0; i < bridgeCount; i++) {
    const center = (i + 0.5) * spacing;
    raw.push({
      start: center - width / 2,
      end: center + width / 2,
    });
  }

  const normalizedSpans: BridgeSpan[] = [];
  for (const span of raw) {
    let start = span.start;
    let end = span.end;

    while (start < 0) {
      start += total;
      end += total;
    }

    start %= total;
    end %= total;

    if (end < start) {
      normalizedSpans.push({ start, end: total });
      normalizedSpans.push({ start: 0, end });
    } else {
      normalizedSpans.push({ start, end });
    }
  }

  normalizedSpans.sort((a, b) => a.start - b.start);

  const merged: BridgeSpan[] = [];
  for (const span of normalizedSpans) {
    const last = merged[merged.length - 1];
    if (!last || span.start > last.end + EPS) {
      merged.push({ ...span });
    } else {
      last.end = Math.max(last.end, span.end);
    }
  }

  return merged.map((span) => ({
    start: round(span.start),
    end: round(span.end),
  }));
}

export function pointAtLength(
  contour: CadPoint[],
  at: number
): CadPoint {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length === 0) return { x: 0, y: 0 };
  if (normalized.length === 1) return { ...normalized[0] };

  const total = contourLength(normalized);
  if (total <= EPS) return { ...normalized[0] };

  let target = at % total;
  if (target < 0) target += total;

  let accumulated = 0;
  for (let i = 0; i < normalized.length; i++) {
    const a = normalized[i];
    const b = normalized[(i + 1) % normalized.length];
    const len = distance(a, b);
    if (len <= EPS) continue;

    const nextAccumulated = accumulated + len;
    if (target <= nextAccumulated + EPS) {
      const t = Math.max(0, Math.min(1, (target - accumulated) / len));
      return {
        x: round(a.x + (b.x - a.x) * t),
        y: round(a.y + (b.y - a.y) * t),
      };
    }

    accumulated = nextAccumulated;
  }

  return { ...normalized[0] };
}

export function sampleContourByStep(
  contour: CadPoint[],
  step = 1
): CadPoint[] {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length < 2) return normalized;

  const total = contourLength(normalized);
  if (total <= EPS) return normalized;

  const count = Math.max(normalized.length, Math.ceil(total / Math.max(step, 0.25)));
  const points: CadPoint[] = [];

  for (let i = 0; i < count; i++) {
    points.push(pointAtLength(normalized, (total * i) / count));
  }

  return points;
}

export function isInsideAnyBridge(
  lengthPos: number,
  spans: BridgeSpan[]
): boolean {
  return spans.some(
    (span) => lengthPos >= span.start - EPS && lengthPos <= span.end + EPS
  );
}
import type { CadPoint } from "../../cad/geometry/textGeometry";

type BridgeInterval = { start: number; end: number };
const EPS = 1e-6;

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerpPoint(a: CadPoint, b: CadPoint, t: number): CadPoint {
  return { x: Number((a.x + (b.x - a.x) * t).toFixed(3)), y: Number((a.y + (b.y - a.y) * t).toFixed(3)) };
}

function normalizeClosedContour(contour: CadPoint[]): CadPoint[] {
  if (contour.length < 2) return contour.map(p => ({ ...p }));
  const first = contour[0];
  const last = contour[contour.length - 1];
  if (distance(first, last) <= EPS) return contour.slice(0, -1).map(p => ({ ...p }));
  return contour.map(p => ({ ...p }));
}

function contourSegmentLengths(contour: CadPoint[]): { lengths: number[]; total: number } {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < contour.length; i++) {
    const a = contour[i];
    const b = contour[(i + 1) % contour.length];
    const len = distance(a, b);
    lengths.push(len);
    total += len;
  }
  return { lengths, total };
}

function normalizeWrapIntervals(intervals: BridgeInterval[], total: number): BridgeInterval[] {
  const result: BridgeInterval[] = [];
  for (const interval of intervals) {
    let start = interval.start;
    let end = interval.end;
    while (start < 0) { start += total; end += total; }
    start %= total;
    end %= total;
    if (end < start) {
      result.push({ start, end: total });
      result.push({ start: 0, end });
    } else result.push({ start, end });
  }
  return result.sort((a, b) => a.start - b.start);
}

function mergeIntervals(intervals: BridgeInterval[]): BridgeInterval[] {
  if (intervals.length === 0) return [];
  const merged: BridgeInterval[] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const next = intervals[i];
    if (next.start <= prev.end + EPS) prev.end = Math.max(prev.end, next.end);
    else merged.push({ ...next });
  }
  return merged;
}

function samplePointAtLength(contour: CadPoint[], lengths: number[], at: number): CadPoint {
  let accumulated = 0;
  for (let i = 0; i < contour.length; i++) {
    const a = contour[i];
    const b = contour[(i + 1) % contour.length];
    const len = lengths[i];
    if (len <= EPS) { accumulated += len; continue; }
    const segStart = accumulated;
    const segEnd = accumulated + len;
    if (at >= segStart - EPS && at <= segEnd + EPS) {
      const t = Math.max(0, Math.min(1, (at - segStart) / len));
      return lerpPoint(a, b, t);
    }
    accumulated = segEnd;
  }
  return { ...contour[0] };
}

function collectKeptIntervals(total: number, bridgeIntervals: BridgeInterval[]): BridgeInterval[] {
  if (bridgeIntervals.length === 0) return [{ start: 0, end: total }];
  const kept: BridgeInterval[] = [];
  let cursor = 0;
  for (const bridge of bridgeIntervals) {
    if (bridge.start > cursor + EPS) kept.push({ start: cursor, end: bridge.start });
    cursor = Math.max(cursor, bridge.end);
  }
  if (cursor < total - EPS) kept.push({ start: cursor, end: total });
  return kept.filter(item => item.end - item.start > EPS);
}

function extractSegmentBetween(contour: CadPoint[], lengths: number[], startLen: number, endLen: number): CadPoint[] {
  const result: CadPoint[] = [samplePointAtLength(contour, lengths, startLen)];
  let accumulated = 0;
  for (let i = 0; i < contour.length; i++) {
    const nextAccumulated = accumulated + lengths[i];
    const vertex = contour[(i + 1) % contour.length];
    if (nextAccumulated > startLen + EPS && nextAccumulated < endLen - EPS) result.push({ ...vertex });
    accumulated = nextAccumulated;
  }
  const endPoint = samplePointAtLength(contour, lengths, endLen);
  if (distance(result[result.length - 1], endPoint) > EPS) result.push(endPoint);
  return result;
}

export function insertBridges(contour: CadPoint[], bridgeCount: number, bridgeWidth: number): CadPoint[][] {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length < 3) return normalized.length >= 2 ? [normalized] : [];
  if (bridgeCount <= 0 || bridgeWidth <= 0) return [normalized];
  const { lengths, total } = contourSegmentLengths(normalized);
  if (total <= EPS) return [normalized];
  const clampedBridgeWidth = Math.min(Math.max(bridgeWidth, 0), total * 0.9);
  const spacing = total / bridgeCount;
  const rawBridgeIntervals: BridgeInterval[] = [];
  for (let i = 0; i < bridgeCount; i++) {
    const center = (i + 0.5) * spacing;
    rawBridgeIntervals.push({ start: center - clampedBridgeWidth / 2, end: center + clampedBridgeWidth / 2 });
  }
  const mergedBridgeIntervals = mergeIntervals(normalizeWrapIntervals(rawBridgeIntervals, total));
  const keptIntervals = collectKeptIntervals(total, mergedBridgeIntervals);
  return keptIntervals.map(interval => extractSegmentBetween(normalized, lengths, interval.start, interval.end)).filter(seg => seg.length >= 2);
}
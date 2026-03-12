// src/toolpath/ramping.ts

import type { Point } from "../types";

export type ToolpathPoint3D = Point & { z: number };

const EPS = 1e-6;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeClosedContour(contour: Point[]): Point[] {
  if (contour.length < 2) return contour.map((p) => ({ ...p }));
  const first = contour[0];
  const last = contour[contour.length - 1];
  if (distance(first, last) <= EPS) return contour.slice(0, -1).map((p) => ({ ...p }));
  return contour.map((p) => ({ ...p }));
}

export function generateRampingPass(
  contour: Point[],
  startZ: number,
  endZ: number,
  turns = 1
): ToolpathPoint3D[] {
  const normalized = normalizeClosedContour(contour);
  if (normalized.length < 2 || turns <= 0) return [];

  const closedContour = [...normalized, normalized[0]];
  const segmentsPerTurn = closedContour.length - 1;
  const totalSteps = segmentsPerTurn * Math.max(1, Math.floor(turns));
  const result: ToolpathPoint3D[] = [];

  for (let step = 0; step <= totalSteps; step++) {
    const globalT = totalSteps === 0 ? 1 : step / totalSteps;
    const z = round(startZ + (endZ - startZ) * globalT);
    const localIndex = step % segmentsPerTurn;
    const point = closedContour[localIndex];
    result.push({ x: round(point.x), y: round(point.y), z });
  }

  if (result.length > 0) {
    const last = result[result.length - 1];
    const first = closedContour[0];
    if (Math.abs(last.x - first.x) > EPS || Math.abs(last.y - first.y) > EPS || Math.abs(last.z - endZ) > EPS) {
      result.push({ x: round(first.x), y: round(first.y), z: round(endZ) });
    }
  }

  return result;
}
import * as THREE from "three";
import type { Bounds, PlacementMode, Point3, Segment, StockDimensions } from "@/types/gcode";
import { machineToSceneCoords, machineToScenePoint } from "@/utils/coordinates";

export const AXIS_MAP = {
  invertX: false,
  invertY: false,
  invertZ: false,
} as const;

export function mapAxis(value: number, invert = false): number {
  return invert ? -value : value;
}

export function toSceneCoords(p: Point3): Point3 {
  return machineToSceneCoords({
    x: mapAxis(p.x, AXIS_MAP.invertX),
    y: mapAxis(p.y, AXIS_MAP.invertY),
    z: mapAxis(p.z, AXIS_MAP.invertZ),
  });
}

export function toScenePoint(p: Point3): THREE.Vector3 {
  return machineToScenePoint({
    x: mapAxis(p.x, AXIS_MAP.invertX),
    y: mapAxis(p.y, AXIS_MAP.invertY),
    z: mapAxis(p.z, AXIS_MAP.invertZ),
  });
}

export function fmt(v: number): string {
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

export function segmentLength(seg: Segment): number {
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  const dz = seg.end.z - seg.start.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Возвращает координаты центра заготовки в системе G-code и смещения left/bottom
 */
export function getStockPlacement(
  bounds: Pick<Bounds, "minX" | "maxX" | "minY" | "maxY">,
  stock: StockDimensions,
  mode: PlacementMode = "origin",
) {
  const centerX =
    mode === "center"
      ? (bounds.minX + bounds.maxX) / 2
      : stock.width / 2;

  const centerY =
    mode === "center"
      ? (bounds.minY + bounds.maxY) / 2
      : stock.height / 2;

  const left = centerX - stock.width / 2;
  const bottom = centerY - stock.height / 2;

  return {
    centerGcode: { x: centerX, y: centerY, z: -stock.thickness / 2 },
    left,
    bottom,
  };
}

export function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
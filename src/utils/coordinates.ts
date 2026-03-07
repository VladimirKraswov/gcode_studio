import * as THREE from "three";
import type { Point3 } from "../types/gcode";
import type { CadPoint2, SvgPoint2 } from "../types/coordinates";

export type ViewTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function cadToSvgPoint(point: CadPoint2, documentHeight: number): SvgPoint2 {
  return {
    x: point.x,
    y: documentHeight - point.y,
  };
}

export function svgToCadPoint(point: SvgPoint2, documentHeight: number): CadPoint2 {
  return {
    x: point.x,
    y: documentHeight - point.y,
  };
}

export function cadToScreenPoint(
  point: CadPoint2,
  documentHeight: number,
  view: ViewTransform,
): SvgPoint2 {
  const svg = cadToSvgPoint(point, documentHeight);
  return {
    x: svg.x * view.scale + view.offsetX,
    y: svg.y * view.scale + view.offsetY,
  };
}

export function screenToCadPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  documentHeight: number,
  view: ViewTransform,
): CadPoint2 {
  const svgX = (clientX - rect.left - view.offsetX) / view.scale;
  const svgY = (clientY - rect.top - view.offsetY) / view.scale;
  return svgToCadPoint({ x: svgX, y: svgY }, documentHeight);
}

/**
 * machine -> scene (только для preview)
 *
 * X инвертируем специально для корректного вида камеры,
 * чтобы на экране +X был вправо без переворота сцены снизу.
 */
export function machineToSceneCoords(p: Point3): Point3 {
  return {
    x: -p.x,
    y: p.z,
    z: p.y,
  };
}

export function machineToScenePoint(p: Point3): THREE.Vector3 {
  const s = machineToSceneCoords(p);
  return new THREE.Vector3(s.x, s.y, s.z);
}
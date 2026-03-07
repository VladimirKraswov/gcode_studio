import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ParsedGCode, PlacementMode, StockDimensions } from "../types/gcode";
import { AXIS_MAP, clamp, getStockPlacement, toSceneCoords } from "../utils";

type MaterialRemovalMeshProps = {
  parsed: ParsedGCode;
  stock: StockDimensions;
  progress: number;
  totalLength: number;
  placementMode: PlacementMode;
  detailLevel?: number;
};

export function MaterialRemovalMesh({
  parsed,
  stock,
  progress,
  totalLength,
  placementMode,
  detailLevel = 5,
}: MaterialRemovalMeshProps) {
  const { bounds, segments } = parsed;
  const { width, height: depth, thickness } = stock;
  const invertX = AXIS_MAP.invertX;

  const level = clamp(detailLevel, 1, 10);
  const t = (level - 1) / 9;

  const gridX = Math.floor(100 + t * 900);
  const gridY = Math.floor(100 + t * 900);
  const stepDensity = 1 + t * 9;
  const recomputeNormals = level >= 6;

  const placement = useMemo(
    () => getStockPlacement(bounds, stock, placementMode),
    [bounds, placementMode, stock],
  );

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, depth, gridX - 1, gridY - 1);
    plane.rotateX(-Math.PI / 2);
    return plane;
  }, [depth, gridX, gridY, width]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const heights = useMemo(() => {
    const arr = new Float32Array(gridX * gridY);
    arr.fill(0);
    return arr;
  }, [gridX, gridY]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8b17b",
        roughness: 0.95,
        metalness: 0.02,
        side: THREE.DoubleSide,
        flatShading: !recomputeNormals,
      }),
    [recomputeNormals],
  );

  useEffect(() => {
    const targetLength = (progress / 100) * totalLength;
    heights.fill(0);

    let accumulated = 0;

    for (let s = 0; s < segments.length; s += 1) {
      const seg = segments[s];

      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const dz = seg.end.z - seg.start.z;

      const distance = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.001);
      const segStart = accumulated;
      const segEnd = accumulated + distance;
      accumulated = segEnd;

      if (seg.mode !== "G1" || !seg.isCutting) {
        continue;
      }

      const steps = Math.max(2, Math.ceil(distance * stepDensity));
      const limitT =
        segEnd <= targetLength
          ? 1
          : segStart < targetLength
            ? (targetLength - segStart) / distance
            : -1;

      if (limitT < 0) {
        break;
      }

      for (let i = 0; i <= steps; i += 1) {
        const stepT = i / steps;
        if (stepT > limitT) {
          break;
        }

        const x = seg.start.x + dx * stepT;
        const y = seg.start.y + dy * stepT;
        const z = seg.start.z + dz * stepT;

        const localX = x - placement.left;
        const localY = y - placement.bottom;

        if (localX < 0 || localX > width || localY < 0 || localY > depth) {
          continue;
        }

        const mappedX = invertX ? width - localX : localX;
        const gx = clamp(Math.round((mappedX / width) * (gridX - 1)), 0, gridX - 1);
        const gy = clamp(Math.round((localY / depth) * (gridY - 1)), 0, gridY - 1);
        const index = gy * gridX + gx;

        const nextZ = Math.max(z, -thickness);
        if (nextZ < heights[index]) {
          heights[index] = nextZ;
        }
      }

      if (segEnd > targetLength) {
        break;
      }
    }

    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = positionAttribute.array as Float32Array;

    for (let i = 0; i < heights.length; i += 1) {
      array[i * 3 + 1] = heights[i];
    }

    positionAttribute.needsUpdate = true;

    if (recomputeNormals) {
      geometry.computeVertexNormals();
    }
  }, [
    depth,
    geometry,
    gridX,
    gridY,
    heights,
    invertX,
    placement.bottom,
    placement.left,
    progress,
    recomputeNormals,
    segments,
    stepDensity,
    thickness,
    totalLength,
    width,
  ]);

  const center = toSceneCoords(placement.centerGcode);

  return (
    <group position={[center.x, 0, center.z]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  );
}
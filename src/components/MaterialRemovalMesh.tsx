import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ParsedGCode, PlacementMode, StockDimensions } from "../types/gcode";
import { clamp, getStockPlacement, toSceneCoords } from "../utils";

type MaterialRemovalMeshProps = {
  parsed: ParsedGCode;
  stock: StockDimensions;
  progress: number;
  totalLength: number;
  placementMode: PlacementMode;
  detailLevel?: number;
  toolDiameter?: number;
};

export function MaterialRemovalMesh({
  parsed,
  stock,
  progress,
  totalLength,
  placementMode,
  detailLevel = 5,
  toolDiameter = 1,
}: MaterialRemovalMeshProps) {
  const { bounds, segments } = parsed;
  const { width, height: depth, thickness } = stock;

  const previewMirrorX = true;

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
    const toolRadius = Math.max(0.001, toolDiameter / 2);
    const cellSizeX = width / Math.max(1, gridX - 1);
    const cellSizeY = depth / Math.max(1, gridY - 1);

    function carveAt(localX: number, localY: number, z: number) {
      if (localX < -toolRadius || localX > width + toolRadius) return;
      if (localY < -toolRadius || localY > depth + toolRadius) return;

      const mappedCenterX = previewMirrorX ? width - localX : localX;

      const radiusCellsX = Math.ceil(toolRadius / Math.max(cellSizeX, 0.0001));
      const radiusCellsY = Math.ceil(toolRadius / Math.max(cellSizeY, 0.0001));

      const centerGX = clamp(
        Math.round((mappedCenterX / width) * (gridX - 1)),
        0,
        gridX - 1,
      );
      const centerGY = clamp(
        Math.round((localY / depth) * (gridY - 1)),
        0,
        gridY - 1,
      );

      const nextZ = Math.max(z, -thickness);

      for (let oy = -radiusCellsY; oy <= radiusCellsY; oy += 1) {
        const gy = centerGY + oy;
        if (gy < 0 || gy >= gridY) continue;

        for (let ox = -radiusCellsX; ox <= radiusCellsX; ox += 1) {
          const gx = centerGX + ox;
          if (gx < 0 || gx >= gridX) continue;

          const sampleX = (gx / (gridX - 1)) * width;
          const sampleY = (gy / (gridY - 1)) * depth;

          const dx = sampleX - mappedCenterX;
          const dy = sampleY - localY;

          if (dx * dx + dy * dy <= toolRadius * toolRadius) {
            const index = gy * gridX + gx;
            if (nextZ < heights[index]) {
              heights[index] = nextZ;
            }
          }
        }
      }
    }

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

        carveAt(localX, localY, z);
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
    placement.bottom,
    placement.left,
    previewMirrorX,
    progress,
    recomputeNormals,
    segments,
    stepDensity,
    thickness,
    toolDiameter,
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
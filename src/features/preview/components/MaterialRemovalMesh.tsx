import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ParsedGCode, PlacementMode, StockDimensions } from "@/types/gcode";
import { clamp, getStockPlacement, toSceneCoords } from "@/shared/utils/common";
import { useTheme } from "@/shared/hooks/useTheme";
import { logger } from "@/shared/utils/logger";

type MaterialRemovalMeshProps = {
  parsed: ParsedGCode;
  stock: StockDimensions;
  progress: number; // 0..100
  totalLength: number;
  placementMode: PlacementMode;
  detailLevel?: number;
  toolDiameter?: number;
  mirrorX?: boolean;
};

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function MaterialRemovalMesh({
  parsed,
  stock,
  progress,
  totalLength,
  placementMode,
  detailLevel = 5,
  toolDiameter = 1,
  mirrorX = true,
}: MaterialRemovalMeshProps) {
  const { isDark } = useTheme();
  const { bounds, segments } = parsed;
  const { width, height: depth, thickness } = stock;

  const level = clamp(detailLevel, 1, 10);
  const t = (level - 1) / 9;

  // Чуть мягче рост, чтобы не убивать FPS
  const gridX = Math.floor(120 + t * 420);
  const gridY = Math.floor(120 + t * 420);
  const stepDensity = 2 + t * 10;

  // Квантуем прогресс, чтобы не пересчитывать меш на каждый кадр
  const progressBucket = useMemo(() => {
    const p = clamp(progress, 0, 100);
    return Math.round(p * 2) / 2; // шаг 0.5%
  }, [progress]);

  const placement = useMemo(
    () => getStockPlacement(bounds, stock, placementMode),
    [bounds, placementMode, stock],
  );

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, depth, gridX - 1, gridY - 1);
    plane.rotateX(-Math.PI / 2);

    const colorArray = new Float32Array(gridX * gridY * 3);
    plane.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    return plane;
  }, [depth, gridX, gridY, width]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const heights = useMemo(() => new Float32Array(gridX * gridY), [gridX, gridY]);
  const shade = useMemo(() => new Float32Array(gridX * gridY), [gridX, gridY]);

  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        side: THREE.FrontSide,
        flatShading: false,
        vertexColors: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  const lastRemovalStats = useRef<{ progress: number; carved: number }>({ progress: -1, carved: 0 });

  const baseWoodColor = useMemo(() => {
    return new THREE.Color(
      isDark
        ? readCssVar("--color-panel-muted", "#44403c")
        : "#ddb98b",
    );
  }, [isDark]);

  const cutWoodColor = useMemo(() => {
    return new THREE.Color(
      isDark
        ? readCssVar("--color-border-strong", "#78716c")
        : "#6b4428",
    );
  }, [isDark]);

  useEffect(() => {
    const targetLength = (progressBucket / 100) * totalLength;
    heights.fill(0);
    shade.fill(0);

    let accumulated = 0;
    const toolRadius = Math.max(0.001, toolDiameter / 2);

    const cellSizeX = width / Math.max(1, gridX - 1);
    const cellSizeY = depth / Math.max(1, gridY - 1);

    const cellDiagonal = Math.sqrt(cellSizeX * cellSizeX + cellSizeY * cellSizeY);
    const effectiveRadius = toolRadius + cellDiagonal * 0.45;
    const effectiveRadiusSq = effectiveRadius * effectiveRadius;

    const carveAt = (localX: number, localY: number, z: number) => {
      if (localX < -effectiveRadius || localX > width + effectiveRadius) return;
      if (localY < -effectiveRadius || localY > depth + effectiveRadius) return;

      let centerX = mirrorX ? width - localX : localX;
      centerX = Math.min(width + effectiveRadius, Math.max(-effectiveRadius, centerX));

      const minGX = Math.floor((centerX - effectiveRadius) / cellSizeX);
      const maxGX = Math.ceil((centerX + effectiveRadius) / cellSizeX);
      const minGY = Math.floor((localY - effectiveRadius) / cellSizeY);
      const maxGY = Math.ceil((localY + effectiveRadius) / cellSizeY);

      const gxStart = Math.max(0, minGX);
      const gxEnd = Math.min(gridX - 1, maxGX);
      const gyStart = Math.max(0, minGY);
      const gyEnd = Math.min(gridY - 1, maxGY);

      const nextZ = Math.max(-thickness, Math.min(0, z));

      for (let gy = gyStart; gy <= gyEnd; gy++) {
        for (let gx = gxStart; gx <= gxEnd; gx++) {
          const sampleX = (gx / (gridX - 1)) * width;
          const sampleY = (gy / (gridY - 1)) * depth;

          const dx = sampleX - centerX;
          const dy = sampleY - localY;
          const distSq = dx * dx + dy * dy;

          if (distSq <= effectiveRadiusSq) {
            const index = gy * gridX + gx;

            if (nextZ < heights[index]) {
              heights[index] = nextZ;
            }

            const distance01 = Math.min(1, Math.sqrt(distSq) / Math.max(effectiveRadius, 0.0001));
            const influence = 1 - distance01;
            shade[index] = Math.max(shade[index], 0.15 + influence * 0.85);
          }
        }
      }
    };

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];

      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const dz = seg.end.z - seg.start.z;

      const distance = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.001);

      const segStart = accumulated;
      const segEnd = accumulated + distance;
      accumulated = segEnd;

      if (seg.mode !== "G1" || !seg.isCutting) continue;

      const limitT =
        segEnd <= targetLength
          ? 1
          : segStart < targetLength
            ? (targetLength - segStart) / distance
            : -1;

      if (limitT < 0) break;

      const maxStepLen = Math.max(Math.min(cellSizeX, cellSizeY) * 0.9, 0.08);
      const stepsByDensity = Math.ceil(distance * stepDensity);
      const stepsByGrid = Math.ceil(distance / maxStepLen);
      const steps = Math.max(2, stepsByDensity, stepsByGrid);

      for (let i = 0; i <= steps; i++) {
        const stepT = i / steps;
        if (stepT > limitT) break;

        const x = seg.start.x + dx * stepT;
        const y = seg.start.y + dy * stepT;
        const z = seg.start.z + dz * stepT;

        const localX = x - placement.left;
        const localY = y - placement.bottom;

        carveAt(localX, localY, z);
      }

      if (segEnd > targetLength) break;
    }

    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < heights.length; i++) {
      positions[i * 3 + 1] = heights[i];
    }
    positionAttr.needsUpdate = true;

    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const colors = colorAttr.array as Float32Array;

    let carvedCount = 0;
    let minZ = 0;

    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < 0) {
        carvedCount++;
        if (heights[i] < minZ) minZ = heights[i];
      }
    }

    if (progressBucket > 0 && Math.abs(progressBucket - lastRemovalStats.current.progress) > 5) {
      const hasCuttingInSource = segments.some(s => s.isCutting && s.mode === 'G1');

      if (hasCuttingInSource && progressBucket > 10 && carvedCount === 0) {
        logger.warn("MATERIAL", "No material was removed. Check placement and stock dimensions.", {
            placement: { left: placement.left, bottom: placement.bottom },
            stock: { width, depth, thickness },
        });
      }

      lastRemovalStats.current = { progress: progressBucket, carved: carvedCount };
    }

    for (let i = 0; i < shade.length; i++) {
      const k = clamp(shade[i], 0, 1);
      colors[i * 3] = THREE.MathUtils.lerp(baseWoodColor.r, cutWoodColor.r, k);
      colors[i * 3 + 1] = THREE.MathUtils.lerp(baseWoodColor.g, cutWoodColor.g, k);
      colors[i * 3 + 2] = THREE.MathUtils.lerp(baseWoodColor.b, cutWoodColor.b, k);
    }
    colorAttr.needsUpdate = true;

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }, [
    baseWoodColor,
    cutWoodColor,
    depth,
    geometry,
    gridX,
    gridY,
    heights,
    mirrorX,
    placement.bottom,
    placement.left,
    progressBucket,
    segments,
    shade,
    stepDensity,
    thickness,
    toolDiameter,
    totalLength,
    width,
  ]);

  const center = toSceneCoords(placement.centerGcode);

  return (
    <group position={[center.x, 0, center.z]}>
      <mesh
        geometry={geometry}
        material={material}
        castShadow={false}
        receiveShadow={false}
        renderOrder={2}
      />
    </group>
  );
}
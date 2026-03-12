import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Bounds, PlacementMode, StockDimensions } from "@/types/gcode";
import { getStockPlacement, toScenePoint } from "@/shared/utils/common";

type AutoFitCameraProps = {
  bounds: Bounds;
  stock: StockDimensions;
  placementMode: PlacementMode;
  cameraResetKey: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

export function AutoFitCamera({
  bounds,
  stock,
  placementMode,
  cameraResetKey,
  controlsRef,
}: AutoFitCameraProps) {
  const { camera, size } = useThree();

  const placement = useMemo(
    () => getStockPlacement(bounds, stock, placementMode),
    [bounds, stock, placementMode],
  );

  useEffect(() => {
    const sizeX = Math.max(stock.width, bounds.maxX - bounds.minX, 1);
    const sizeY = Math.max(stock.height, bounds.maxY - bounds.minY, 1);
    const sizeZ = Math.max(
      stock.thickness + Math.max(0, bounds.maxZ),
      bounds.maxZ - bounds.minZ,
      1,
    );

    const targetScene = toScenePoint(placement.centerGcode);

    const fitWidth = Math.max(sizeX, sizeY);
    const fitHeight = Math.max(sizeZ, stock.thickness, 1);

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov || 50);
    const aspect = Math.max(size.width / Math.max(size.height, 1), 1);

    const distanceByHeight = fitHeight / (2 * Math.tan(fov / 2));
    const distanceByWidth = fitWidth / (2 * Math.tan(fov / 2)) / aspect;
    const distance = Math.max(distanceByHeight, distanceByWidth, 120) * 1.55;

    const cameraPosition = new THREE.Vector3(
      targetScene.x + distance * 0.18,
      targetScene.y + distance,
      targetScene.z - distance * 0.28,
    );

    camera.position.copy(cameraPosition);
    camera.up.set(0, 0, 1);
    camera.near = 0.5;
    camera.far = Math.max(5000, distance * 12);
    camera.lookAt(targetScene);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(targetScene);
      controlsRef.current.update();
    }
  }, [bounds, camera, cameraResetKey, controlsRef, placement, size.height, size.width, stock]);

  return null;
}
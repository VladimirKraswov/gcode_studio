import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Bounds, PlacementMode, StockDimensions } from "../types/gcode";
import { getStockPlacement, toScenePoint } from "../utils";

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
  const { camera } = useThree();

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

    const maxHorizontalSize = Math.max(sizeX, sizeY);
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    const targetScene = toScenePoint(placement.centerGcode);
    const distance = Math.max(maxHorizontalSize * 1.6, maxSize * 2.0, 120);

    const cameraPosition = new THREE.Vector3(
      targetScene.x,
      targetScene.y + distance,
      targetScene.z - distance * 0.22,
    );

    camera.position.copy(cameraPosition);
    camera.up.set(0, 0, 1);
    camera.near = 0.1;
    camera.far = Math.max(4000, distance * 10);
    camera.lookAt(targetScene);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(targetScene);
      controlsRef.current.update();
    }
  }, [bounds, camera, cameraResetKey, controlsRef, placement, stock]);

  return null;
}
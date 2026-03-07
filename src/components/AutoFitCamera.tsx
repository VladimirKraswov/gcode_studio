import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
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

  useEffect(() => {
    const sizeX = Math.max(stock.width, bounds.maxX - bounds.minX, 1);
    const sizeY = Math.max(stock.height, bounds.maxY - bounds.minY, 1);
    const sizeZ = Math.max(
      stock.thickness + Math.max(0, bounds.maxZ),
      bounds.maxZ - bounds.minZ,
      1,
    );
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    const placement = getStockPlacement(bounds, stock, placementMode);
    const centerScene = toScenePoint(placement.centerGcode);
    const cornerScene = toScenePoint({ x: placement.left, y: placement.bottom, z: 0 });

    const direction = new THREE.Vector3()
      .subVectors(centerScene, cornerScene);

    if (direction.lengthSq() < 1e-6) {
      direction.set(-1, 1, 1);
    }

    direction.normalize();

    const distance = maxSize * 2.5;
    const cameraPos = cornerScene.clone().add(direction.multiplyScalar(distance));

    camera.position.copy(cameraPos);
    camera.near = 0.1;
    camera.far = Math.max(2000, maxSize * 20);
    camera.lookAt(cornerScene);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(cornerScene);
      controlsRef.current.update();
    }
  }, [bounds, camera, cameraResetKey, controlsRef, placementMode, stock]);

  return null;
}
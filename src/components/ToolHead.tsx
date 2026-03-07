import * as THREE from "three";
import type { Point3 } from "../types/gcode";

type ToolHeadProps = {
  position: Point3;
  cutting: boolean;
  toScenePoint: (p: Point3) => THREE.Vector3;
};

export default function ToolHead({
  position,
  cutting,
  toScenePoint,
}: ToolHeadProps) {
  const scenePos = toScenePoint(position);

  return (
    <group position={scenePos}>
      <mesh castShadow>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color={cutting ? "#ef4444" : "#f59e0b"} />
      </mesh>

      <mesh position={[0, -2.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 4, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}
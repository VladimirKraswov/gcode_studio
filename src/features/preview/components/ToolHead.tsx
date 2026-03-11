import * as THREE from "three";
import type { Point3 } from "@/types/gcode";

type ToolHeadProps = {
  position: Point3;
  cutting: boolean;
  toolDiameter?: number;
  toScenePoint: (p: Point3) => THREE.Vector3;
};

export function ToolHead({
  position,
  cutting,
  toolDiameter = 3,
  toScenePoint,
}: ToolHeadProps) {
  const scenePos = toScenePoint(position);
  const radius = Math.max(0.4, toolDiameter / 2);

  return (
    <group position={scenePos}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <sphereGeometry args={[Math.max(1.2, radius * 0.55), 16, 16]} />
        <meshStandardMaterial color={cutting ? "#ef4444" : "#f59e0b"} />
      </mesh>

      <mesh position={[0, -2.5, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 4, 24]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}

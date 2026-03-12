import { Html } from "@react-three/drei";
import type { Point3 } from "@/types/gcode";
import { toSceneCoords } from "@/shared/utils/common";

type ProgressBillboardProps = {
  position: Point3;
  progress: number; // 0..100
};

export function ProgressBillboard({ position, progress }: ProgressBillboardProps) {
  const scene = toSceneCoords(position);

  return (
    <Html position={[scene.x, scene.y + 6, scene.z]} center distanceFactor={10}>
      <div className="ui-float-chip">{progress.toFixed(1)}%</div>
    </Html>
  );
}
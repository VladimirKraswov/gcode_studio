import { Html } from "@react-three/drei";
import type { Point3 } from "../types/gcode";
import { toSceneCoords } from "../utils";

type ProgressBillboardProps = {
  position: Point3;
  progress: number;
};

export function ProgressBillboard({ position, progress }: ProgressBillboardProps) {
  const scene = toSceneCoords(position);

  return (
    <Html position={[scene.x, scene.y + 6, scene.z]} center distanceFactor={10}>
      <div
        style={{
          background: "rgba(255,255,255,0.92)",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "4px 8px",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {progress.toFixed(1)}%
      </div>
    </Html>
  );
}
import { Html } from "@react-three/drei";
import type { Point3 } from "../types/gcode";
import { toSceneCoords } from "../utils";
import { useTheme } from "../contexts/ThemeContext";

type ProgressBillboardProps = {
  position: Point3;
  progress: number;
};

export function ProgressBillboard({ position, progress }: ProgressBillboardProps) {
  const scene = toSceneCoords(position);
  const { theme } = useTheme();

  return (
    <Html position={[scene.x, scene.y + 6, scene.z]} center distanceFactor={10}>
      <div
        style={{
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: "4px 8px",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: theme.shadowSoft,
          backdropFilter: "blur(4px)",
        }}
      >
        {progress.toFixed(1)}%
      </div>
    </Html>
  );
}
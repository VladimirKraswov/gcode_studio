import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraInfo } from "../types/gcode";

type CameraDebugProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onUpdate: (info: CameraInfo) => void;
};

export function CameraDebug({ controlsRef, onUpdate }: CameraDebugProps) {
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const handleChange = () => {
      onUpdate({
        position: camera.position.clone(),
        target: controls.target.clone(),
      });
    };

    handleChange();
    controls.addEventListener("change", handleChange);

    return () => {
      controls.removeEventListener("change", handleChange);
    };
  }, [camera, controlsRef, onUpdate]);

  return null;
}
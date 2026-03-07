import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "../types/gcode";
import { toScenePoint } from "../utils";

type SimpleLineProps = {
  start: Point3;
  end: Point3;
  color: string;
  opacity?: number;
};

export function SimpleLine({
  start,
  end,
  color,
  opacity = 1,
}: SimpleLineProps) {
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      toScenePoint(start),
      toScenePoint(end),
    ]);
  }, [end, start]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }))} />
  );
}
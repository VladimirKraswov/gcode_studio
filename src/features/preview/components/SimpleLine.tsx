import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/types/gcode";
import { toScenePoint } from "@/shared/utils/common";

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
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
  }, [color, opacity]);

  const line = useMemo(() => {
    return new THREE.Line(geometry, material);
  }, [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive object={line} />;
}
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/types/gcode";
import { toScenePoint } from "@/shared/utils/common";

type SimpleLineProps = {
  start: Point3;
  end: Point3;
  color: string;
  opacity?: number;
};

export const SimpleLine = memo(function SimpleLine({
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
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
  }, [color, opacity]);

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive object={line} frustumCulled={false} /> as any;
});
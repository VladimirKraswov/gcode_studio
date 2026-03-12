import type { Bounds, PlacementMode, StockDimensions } from "@/types/gcode";
import { getStockPlacement, toSceneCoords } from "@/shared/utils/common";
import { useTheme } from "@/shared/hooks/useTheme";
import { useMemo } from "react";
import * as THREE from "three";

type WorkAreaProps = {
  bounds: Bounds;
  stock: StockDimensions;
  placementMode: PlacementMode;
};

export function WorkArea({ bounds, stock, placementMode }: WorkAreaProps) {
  const { theme } = useTheme();
  const placement = getStockPlacement(bounds, stock, placementMode);
  const center = toSceneCoords(placement.centerGcode);

  const colors = useMemo(
    () => ({
      grid: new THREE.Color(theme.cad.gridMajor),
      lines: new THREE.Color(theme.cad.gridMinor),
    }),
    [theme],
  );

  const size = Math.max(stock.width, stock.height, 100) + 80;
  const divisions = Math.max(20, Math.round(size / 10));

  return (
    <group>
      <gridHelper
        args={[size, divisions, colors.grid, colors.lines]}
        position={[center.x, -stock.thickness, center.z]}
      />
    </group>
  );
}
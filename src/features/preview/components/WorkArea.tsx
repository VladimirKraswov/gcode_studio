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

  const colors = useMemo(() => ({
    grid: new THREE.Color(theme.cad.gridMajor),
    lines: new THREE.Color(theme.cad.gridMinor),
  }), [theme]);

  return (
    <group>
      <gridHelper
        args={[Math.max(stock.width + 20, stock.height + 20), 20, colors.grid, colors.lines]}
        position={[center.x, -stock.thickness, center.z]}
      />
    </group>
  );
}

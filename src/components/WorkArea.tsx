import type { Bounds, PlacementMode, StockDimensions } from "../types/gcode";
import { getStockPlacement, toSceneCoords } from "../utils";

type WorkAreaProps = {
  bounds: Bounds;
  stock: StockDimensions;
  placementMode: PlacementMode;
};

export function WorkArea({ bounds, stock, placementMode }: WorkAreaProps) {
  const placement = getStockPlacement(bounds, stock, placementMode);
  const center = toSceneCoords(placement.centerGcode);

  return (
    <group>
      {/* <mesh position={[center.x, -stock.thickness - 0.2, center.z]} receiveShadow>
        <boxGeometry args={[stock.width + 20, 0.4, stock.height + 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.05} roughness={0.85} />
      </mesh> */}

      <gridHelper
        args={[Math.max(stock.width + 20, stock.height + 20), 20, 0x94a3b8, 0xcbd5e1]}
        position={[center.x, -stock.thickness, center.z]}
      />
    </group>
  );
}
import type { Bounds, PlacementMode, StockDimensions } from "../types/gcode";
import { getStockPlacement, toSceneCoords } from "../utils";

type StockWireframeProps = {
  bounds: Bounds;
  stock: StockDimensions;
  placementMode: PlacementMode;
};

export function StockWireframe({
  bounds,
  stock,
  placementMode,
}: StockWireframeProps) {
  const placement = getStockPlacement(bounds, stock, placementMode);
  const center = toSceneCoords(placement.centerGcode);

  return (
    <mesh position={[center.x, center.y, center.z]}>
      <boxGeometry args={[stock.width, stock.thickness, stock.height]} />
      <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.35} />
    </mesh>
  );
}
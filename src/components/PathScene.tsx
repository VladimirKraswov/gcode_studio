import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type {
  CameraInfo,
  CurrentState,
  ParsedGCode,
  PlacementMode,
  StockDimensions,
} from "../types/gcode";
import { getStockPlacement, toSceneCoords, toScenePoint } from "../utils";
import { AutoFitCamera } from "./AutoFitCamera";
import { CameraDebug } from "./CameraDebug";
import { MaterialRemovalMesh } from "./MaterialRemovalMesh";
import { ProgressBillboard } from "./ProgressBillboard";
import { SimpleLine } from "./SimpleLine";
import { StockWireframe } from "./StockWireframe";
import ToolHead from "./ToolHead";
import { WorkArea } from "./WorkArea";

type PathSceneProps = {
  parsed: ParsedGCode;
  currentState: CurrentState;
  progress: number;
  cameraResetKey: number;
  stock: StockDimensions;
  showMaterialRemoval: boolean;
  totalLength: number;
  placementMode: PlacementMode;
  detailLevel: number;
  onCameraUpdate: (camera: CameraInfo) => void;
};

function buildAxisLine(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  return [from.clone(), to.clone()];
}

export function PathScene({
  parsed,
  currentState,
  progress,
  cameraResetKey,
  stock,
  showMaterialRemoval,
  totalLength,
  placementMode,
  detailLevel,
  onCameraUpdate,
}: PathSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const placement = useMemo(
    () => getStockPlacement(parsed.bounds, stock, placementMode),
    [parsed.bounds, placementMode, stock],
  );

  const stockCenter = useMemo(
    () => toSceneCoords(placement.centerGcode),
    [placement],
  );

  const cornerScene = useMemo(
    () => toScenePoint({ x: placement.left, y: placement.bottom, z: 0 }),
    [placement],
  );

  const axesHelper = useMemo(() => {
    const length = Math.max(stock.width, stock.height, stock.thickness) * 1.2;
    if (length <= 0) {
      return null;
    }

    const origin = toScenePoint({ x: 0, y: 0, z: 0 });
    const xEnd = toScenePoint({ x: length, y: 0, z: 0 });
    const yEnd = toScenePoint({ x: 0, y: length, z: 0 });
    const zEnd = toScenePoint({ x: 0, y: 0, z: length });

    return (
      <group>
        <Line points={buildAxisLine(origin, xEnd)} color="red" lineWidth={2} />
        <Text position={xEnd} color="red" fontSize={5} anchorX="left" anchorY="middle">
          X
        </Text>

        <Line points={buildAxisLine(origin, yEnd)} color="green" lineWidth={2} />
        <Text position={yEnd} color="green" fontSize={5} anchorX="left" anchorY="middle">
          Y
        </Text>

        <Line points={buildAxisLine(origin, zEnd)} color="blue" lineWidth={2} />
        <Text position={zEnd} color="blue" fontSize={5} anchorX="left" anchorY="middle">
          Z
        </Text>
      </group>
    );
  }, [stock]);

  const rulers = useMemo(() => {
    const { minX, maxX, minY, maxY, minZ, maxZ } = parsed.bounds;

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxY) ||
      !Number.isFinite(minZ) ||
      !Number.isFinite(maxZ)
    ) {
      return null;
    }

    const corners = [
      [minX, minY, minZ],
      [maxX, minY, minZ],
      [maxX, maxY, minZ],
      [minX, maxY, minZ],
      [minX, minY, maxZ],
      [maxX, minY, maxZ],
      [maxX, maxY, maxZ],
      [minX, maxY, maxZ],
    ].map(([x, y, z]) => toScenePoint({ x, y, z }));

    const edges: Array<[THREE.Vector3, THREE.Vector3]> = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
      [corners[4], corners[5]],
      [corners[5], corners[6]],
      [corners[6], corners[7]],
      [corners[7], corners[4]],
      [corners[0], corners[4]],
      [corners[1], corners[5]],
      [corners[2], corners[6]],
      [corners[3], corners[7]],
    ];

    return edges
      .map(([start, end], idx) => {
        if (start.distanceTo(end) < 0.001) {
          return null;
        }

        return (
          <Line
            key={`ruler-${idx}`}
            points={[start, end]}
            color="#94a3b8"
            lineWidth={1}
            dashed
            dashScale={1}
            dashSize={2}
            gapSize={1}
          />
        );
      })
      .filter(Boolean);
  }, [parsed.bounds]);

  const renderSegments = parsed.renderSegments;
  const renderedDoneCount = Math.floor((progress / 100) * renderSegments.length);

  return (
    <Canvas
      camera={{ position: [-155.74, 311.41, -200.47], fov: 50 }}
      shadows={{ type: THREE.PCFShadowMap }}
    >
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight intensity={0.45} groundColor="#cbd5e1" />
      <directionalLight
        position={[80, 110, 60]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-mapType={THREE.PCFShadowMap}
      />

      <AutoFitCamera
        bounds={parsed.bounds}
        stock={stock}
        placementMode={placementMode}
        cameraResetKey={cameraResetKey}
        controlsRef={controlsRef}
      />

      <WorkArea bounds={parsed.bounds} stock={stock} placementMode={placementMode} />
      {axesHelper}
      {rulers}

      {showMaterialRemoval && (
        <mesh position={[stockCenter.x, stockCenter.y, stockCenter.z]} receiveShadow>
          <boxGeometry args={[stock.width, stock.thickness, stock.height]} />
          <meshStandardMaterial
            color="#c89d67"
            transparent
            opacity={0.25}
            roughness={0.6}
          />
        </mesh>
      )}

      <StockWireframe bounds={parsed.bounds} stock={stock} placementMode={placementMode} />

      {showMaterialRemoval ? (
        <MaterialRemovalMesh
          parsed={parsed}
          stock={stock}
          progress={progress}
          totalLength={totalLength}
          placementMode={placementMode}
          detailLevel={detailLevel}
        />
      ) : (
        <>
          {renderSegments.map((seg) => (
            <SimpleLine
              key={`bg-${seg.id}`}
              start={seg.start}
              end={seg.end}
              color={seg.mode === "G0" ? "#bfdbfe" : "#cbd5e1"}
              opacity={0.55}
            />
          ))}

          {renderSegments.slice(0, Math.max(renderedDoneCount, 0)).map((seg) => (
            <SimpleLine
              key={`done-${seg.id}`}
              start={seg.start}
              end={seg.end}
              color={seg.mode === "G0" ? "#2563eb" : seg.isCutting ? "#111827" : "#475569"}
              opacity={1}
            />
          ))}

          {currentState.segment && (
            <>
              <SimpleLine
                start={currentState.segment.start}
                end={currentState.position}
                color={currentState.segment.mode === "G0" ? "#1d4ed8" : "#dc2626"}
                opacity={1}
              />
              <ProgressBillboard position={currentState.position} progress={progress} />
            </>
          )}
        </>
      )}

      <ToolHead
        position={currentState.position}
        cutting={currentState.position.z <= 0}
        toScenePoint={toScenePoint}
      />

      <OrbitControls
        ref={controlsRef}
        key={cameraResetKey}
        makeDefault
        target={[cornerScene.x, cornerScene.y, cornerScene.z]}
        enableDamping
        dampingFactor={0.08}
        screenSpacePanning
        minDistance={10}
        maxDistance={1000}
      />

      <CameraDebug controlsRef={controlsRef} onUpdate={onCameraUpdate} />
    </Canvas>
  );
}
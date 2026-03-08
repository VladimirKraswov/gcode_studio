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
  toolDiameter?: number;
  onCameraUpdate: (camera: CameraInfo) => void;
};

function buildAxisLine(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  return [from.clone(), to.clone()];
}

function chooseTickStep(length: number): number {
  const candidates = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
  for (const step of candidates) {
    if ((length * 2) / step <= 12) {
      return step;
    }
  }
  return candidates[candidates.length - 1];
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
  toolDiameter = 3,
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

  const orbitTarget = useMemo(
    () => toScenePoint(placement.centerGcode),
    [placement],
  );

  const axesHelper = useMemo(() => {
    const length = Math.max(
      stock.width,
      stock.height,
      stock.thickness,
      Math.abs(parsed.bounds.minX),
      Math.abs(parsed.bounds.maxX),
      Math.abs(parsed.bounds.minY),
      Math.abs(parsed.bounds.maxY),
      Math.abs(parsed.bounds.minZ),
      Math.abs(parsed.bounds.maxZ),
      100,
    ) * 1.15;

    if (length <= 0) return null;

    const tickStep = chooseTickStep(length);
    const tickHalf = Math.max(1.5, length * 0.015);
    const labelOffset = Math.max(4, length * 0.03);

    const origin = toScenePoint({ x: 0, y: 0, z: 0 });

    const xNeg = toScenePoint({ x: -length, y: 0, z: 0 });
    const xPos = toScenePoint({ x: length, y: 0, z: 0 });

    const yNeg = toScenePoint({ x: 0, y: -length, z: 0 });
    const yPos = toScenePoint({ x: 0, y: length, z: 0 });

    const zNeg = toScenePoint({ x: 0, y: 0, z: -length });
    const zPos = toScenePoint({ x: 0, y: 0, z: length });

    const xTicks: React.ReactNode[] = [];
    for (let value = -Math.floor(length / tickStep) * tickStep; value <= length; value += tickStep) {
      if (value === 0) continue;

      const from = toScenePoint({ x: value, y: 0, z: -tickHalf });
      const to = toScenePoint({ x: value, y: 0, z: tickHalf });
      const labelPos = toScenePoint({ x: value, y: 0, z: -labelOffset });

      xTicks.push(
        <group key={`x-tick-${value}`}>
          <Line points={[from, to]} color="#ef4444" lineWidth={1} />
          <Text
            position={labelPos}
            color="#7f1d1d"
            fontSize={Math.max(3.2, length * 0.02)}
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </group>,
      );
    }

    const yTicks: React.ReactNode[] = [];
    for (let value = -Math.floor(length / tickStep) * tickStep; value <= length; value += tickStep) {
      if (value === 0) continue;

      const from = toScenePoint({ x: -tickHalf, y: value, z: 0 });
      const to = toScenePoint({ x: tickHalf, y: value, z: 0 });
      const labelPos = toScenePoint({ x: -labelOffset, y: value, z: 0 });

      yTicks.push(
        <group key={`y-tick-${value}`}>
          <Line points={[from, to]} color="#16a34a" lineWidth={1} />
          <Text
            position={labelPos}
            color="#14532d"
            fontSize={Math.max(3.2, length * 0.02)}
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </group>,
      );
    }

    const zTicks: React.ReactNode[] = [];
    for (let value = -Math.floor(length / tickStep) * tickStep; value <= length; value += tickStep) {
      if (value === 0) continue;

      const from = toScenePoint({ x: -tickHalf, y: 0, z: value });
      const to = toScenePoint({ x: tickHalf, y: 0, z: value });
      const labelPos = toScenePoint({ x: labelOffset, y: 0, z: value });

      zTicks.push(
        <group key={`z-tick-${value}`}>
          <Line points={[from, to]} color="#2563eb" lineWidth={1} />
          <Text
            position={labelPos}
            color="#1e3a8a"
            fontSize={Math.max(3.2, length * 0.02)}
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </group>,
      );
    }

    return (
      <group>
        <Line points={buildAxisLine(xNeg, xPos)} color="red" lineWidth={2} />
        <Line points={buildAxisLine(yNeg, yPos)} color="green" lineWidth={2} />
        <Line points={buildAxisLine(zNeg, zPos)} color="blue" lineWidth={2} />

        {xTicks}
        {yTicks}
        {zTicks}

        <Text
          position={toScenePoint({ x: length + labelOffset, y: 0, z: 0 })}
          color="red"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="left"
          anchorY="middle"
        >
          +X
        </Text>
        <Text
          position={toScenePoint({ x: -length - labelOffset, y: 0, z: 0 })}
          color="red"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="right"
          anchorY="middle"
        >
          -X
        </Text>

        <Text
          position={toScenePoint({ x: 0, y: length + labelOffset, z: 0 })}
          color="green"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="center"
          anchorY="middle"
        >
          +Y
        </Text>
        <Text
          position={toScenePoint({ x: 0, y: -length - labelOffset, z: 0 })}
          color="green"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="center"
          anchorY="middle"
        >
          -Y
        </Text>

        <Text
          position={toScenePoint({ x: 0, y: 0, z: length + labelOffset })}
          color="blue"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="center"
          anchorY="middle"
        >
          +Z
        </Text>
        <Text
          position={toScenePoint({ x: 0, y: 0, z: -length - labelOffset })}
          color="blue"
          fontSize={Math.max(4.4, length * 0.024)}
          anchorX="center"
          anchorY="middle"
        >
          -Z
        </Text>

        <Text
          position={origin}
          color="#0f172a"
          fontSize={Math.max(3.8, length * 0.02)}
          anchorX="left"
          anchorY="bottom"
        >
          0
        </Text>
      </group>
    );
  }, [parsed.bounds, stock]);

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
  const doneSegments = renderSegments.slice(0, Math.max(renderedDoneCount, 0));

  return (
    <Canvas
      camera={{ position: [0, 300, 0], fov: 50 }}
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
          toolDiameter={toolDiameter}
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

          {doneSegments.map((seg) => (
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
        toolDiameter={toolDiameter}
        toScenePoint={toScenePoint}
      />

      <OrbitControls
        ref={controlsRef}
        key={cameraResetKey}
        makeDefault
        target={[orbitTarget.x, orbitTarget.y, orbitTarget.z]}
        enableDamping
        dampingFactor={0.08}
        screenSpacePanning
        minDistance={10}
        maxDistance={3000}
        enableRotate
        rotateSpeed={0.45}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <CameraDebug controlsRef={controlsRef} onUpdate={onCameraUpdate} />
    </Canvas>
  );
}
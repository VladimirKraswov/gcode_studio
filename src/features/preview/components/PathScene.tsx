import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type {
  CameraInfo,
  CurrentState,
  ParsedGCode,
  PlacementMode,
  StockDimensions,
} from "@/types/gcode";
import { getStockPlacement, toSceneCoords, toScenePoint } from "@/shared/utils/common";
import { AutoFitCamera } from "./AutoFitCamera";
import { CameraDebug } from "./CameraDebug";
import { MaterialRemovalMesh } from "./MaterialRemovalMesh";
import { ProgressBillboard } from "./ProgressBillboard";
import { SimpleLine } from "./SimpleLine";
import { ToolHead } from "./ToolHead";
import { WorkArea } from "./WorkArea";
import { useTheme } from "@/shared/hooks/useTheme";

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

function AxisLabel({
  position,
  color,
  fontSize,
  children,
  anchorX = "center",
  anchorY = "middle",
}: {
  position: THREE.Vector3;
  color: string;
  fontSize: number;
  children: React.ReactNode;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
}) {
  return (
    <Billboard position={position} follow>
      <Text color={color} fontSize={fontSize} anchorX={anchorX} anchorY={anchorY}>
        {children}
      </Text>
    </Billboard>
  );
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
  const { theme, isDark } = useTheme();

  const colors = useMemo(() => ({
    gridMinor: theme.cad.gridMinor,
    gridMajor: theme.cad.gridMajor,
    axisX: theme.cad.axisX,
    axisY: theme.cad.axisY,
    axisZ: isDark ? "#f59e0b" : "#b45309",
    text: theme.text,
    bg: theme.bgSoft,
    border: theme.border,
    primary: theme.primary,
    primarySoft: isDark ? "rgba(245, 158, 11, 0.15)" : theme.primarySoft,
    primaryText: theme.primaryText,
    success: theme.success,
    danger: theme.danger,
    lineMuted: isDark ? "#44403c" : "#e2e8f0",
  }), [theme, isDark]);

  const placement = useMemo(
    () => getStockPlacement(parsed.bounds, stock, placementMode),
    [parsed.bounds, placementMode, stock],
  );

  const stockCenter = useMemo(() => toSceneCoords(placement.centerGcode), [placement]);
  const orbitTarget = useMemo(() => toScenePoint(placement.centerGcode), [placement]);

  const axesHelper = useMemo(() => {
    const length =
      Math.max(
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
    const tickFontSize = Math.max(3.2, length * 0.02);
    const axisFontSize = Math.max(4.4, length * 0.024);
    const originFontSize = Math.max(3.8, length * 0.02);

    const origin = toScenePoint({ x: 0, y: 0, z: 0 });

    const xNeg = toScenePoint({ x: -length, y: 0, z: 0 });
    const xPos = toScenePoint({ x: length, y: 0, z: 0 });

    const yNeg = toScenePoint({ x: 0, y: -length, z: 0 });
    const yPos = toScenePoint({ x: 0, y: length, z: 0 });

    const zNeg = toScenePoint({ x: 0, y: 0, z: -length });
    const zPos = toScenePoint({ x: 0, y: 0, z: length });

    const xTicks: React.ReactNode[] = [];
    for (
      let value = -Math.floor(length / tickStep) * tickStep;
      value <= length;
      value += tickStep
    ) {
      if (value === 0) continue;

      const from = toScenePoint({ x: value, y: 0, z: -tickHalf });
      const to = toScenePoint({ x: value, y: 0, z: tickHalf });
      const labelPos = toScenePoint({ x: value, y: 0, z: -labelOffset });

      xTicks.push(
        <group key={`x-tick-${value}`}>
          <Line points={[from, to]} color={colors.axisX} lineWidth={1} />
          <AxisLabel position={labelPos} color={colors.axisX} fontSize={tickFontSize}>
            {value}
          </AxisLabel>
        </group>,
      );
    }

    const yTicks: React.ReactNode[] = [];
    for (
      let value = -Math.floor(length / tickStep) * tickStep;
      value <= length;
      value += tickStep
    ) {
      if (value === 0) continue;

      const from = toScenePoint({ x: -tickHalf, y: value, z: 0 });
      const to = toScenePoint({ x: tickHalf, y: value, z: 0 });
      const labelPos = toScenePoint({ x: -labelOffset, y: value, z: 0 });

      yTicks.push(
        <group key={`y-tick-${value}`}>
          <Line points={[from, to]} color={colors.axisY} lineWidth={1} />
          <AxisLabel position={labelPos} color={colors.axisY} fontSize={tickFontSize}>
            {value}
          </AxisLabel>
        </group>,
      );
    }

    const zTicks: React.ReactNode[] = [];
    for (
      let value = -Math.floor(length / tickStep) * tickStep;
      value <= length;
      value += tickStep
    ) {
      if (value === 0) continue;

      const from = toScenePoint({ x: -tickHalf, y: 0, z: value });
      const to = toScenePoint({ x: tickHalf, y: 0, z: value });
      const labelPos = toScenePoint({ x: labelOffset, y: 0, z: value });

      zTicks.push(
        <group key={`z-tick-${value}`}>
          <Line points={[from, to]} color={colors.axisZ} lineWidth={1} />
          <AxisLabel position={labelPos} color={colors.axisZ} fontSize={tickFontSize}>
            {value}
          </AxisLabel>
        </group>,
      );
    }

    return (
      <group>
        <Line points={buildAxisLine(xNeg, xPos)} color={colors.axisX} lineWidth={2} />
        <Line points={buildAxisLine(yNeg, yPos)} color={colors.axisY} lineWidth={2} />
        <Line points={buildAxisLine(zNeg, zPos)} color={colors.axisZ} lineWidth={2} />

        {xTicks}
        {yTicks}
        {zTicks}

        <AxisLabel
          position={toScenePoint({ x: length + labelOffset, y: 0, z: 0 })}
          color={colors.axisX}
          fontSize={axisFontSize}
          anchorX="left"
        >
          +X
        </AxisLabel>

        <AxisLabel
          position={toScenePoint({ x: -length - labelOffset, y: 0, z: 0 })}
          color={colors.axisX}
          fontSize={axisFontSize}
          anchorX="right"
        >
          -X
        </AxisLabel>

        <AxisLabel
          position={toScenePoint({ x: 0, y: length + labelOffset, z: 0 })}
          color={colors.axisY}
          fontSize={axisFontSize}
        >
          +Y
        </AxisLabel>

        <AxisLabel
          position={toScenePoint({ x: 0, y: -length - labelOffset, z: 0 })}
          color={colors.axisY}
          fontSize={axisFontSize}
        >
          -Y
        </AxisLabel>

        <AxisLabel
          position={toScenePoint({ x: 0, y: 0, z: length + labelOffset })}
          color={colors.axisZ}
          fontSize={axisFontSize}
        >
          +Z
        </AxisLabel>

        <AxisLabel
          position={toScenePoint({ x: 0, y: 0, z: -length - labelOffset })}
          color={colors.axisZ}
          fontSize={axisFontSize}
        >
          -Z
        </AxisLabel>

        <AxisLabel
          position={origin}
          color={colors.text}
          fontSize={originFontSize}
          anchorX="left"
          anchorY="bottom"
        >
          0
        </AxisLabel>
      </group>
    );
  }, [parsed.bounds, stock, colors]);

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
            color={colors.border}
            lineWidth={1}
            dashed
            dashScale={1}
            dashSize={2}
            gapSize={1}
          />
        );
      })
      .filter(Boolean);
  }, [parsed.bounds, colors]);

  const renderSegments = parsed.renderSegments;
  const renderedDoneCount = Math.floor((progress / 100) * renderSegments.length);
  const doneSegments = renderSegments.slice(0, Math.max(renderedDoneCount, 0));

  return (
    <Canvas camera={{ position: [0, 300, 0], fov: 50 }} shadows={{ type: THREE.PCFShadowMap }}>
      <color attach="background" args={[colors.bg]} />
      <ambientLight intensity={isDark ? 0.4 : 0.85} />
      <hemisphereLight intensity={0.45} groundColor={colors.border} />
      <directionalLight
        position={[80, 110, 60]}
        intensity={isDark ? 0.8 : 1.25}
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
        <mesh position={[stockCenter.x, stockCenter.y, stockCenter.z]} receiveShadow renderOrder={1}>
          <boxGeometry args={[stock.width, stock.thickness, stock.height]} />
          <meshStandardMaterial
            color={isDark ? "#78350f" : "#c89d67"}
            transparent
            opacity={0.7}
            roughness={0.6}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={2}
            polygonOffsetUnits={2}
          />
        </mesh>
      )}

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
              color={seg.mode === "G0" ? colors.primarySoft : colors.lineMuted}
              opacity={0.55}
            />
          ))}

          {doneSegments.map((seg) => (
            <SimpleLine
              key={`done-${seg.id}`}
              start={seg.start}
              end={seg.end}
              color={
                seg.mode === "G0"
                  ? colors.primary
                  : seg.isCutting
                    ? colors.text
                    : colors.primaryText
              }
              opacity={1}
            />
          ))}

          {currentState.segment && (
            <>
              <SimpleLine
                start={currentState.segment.start}
                end={currentState.position}
                color={currentState.segment.mode === "G0" ? colors.primaryText : colors.danger}
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

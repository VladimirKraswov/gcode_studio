import type * as THREE from "three";

export type MotionMode = "G0" | "G1";
export type PlacementMode = "center" | "origin";

export type Point3 = {
  x: number;
  y: number;
  z: number;
};

export type ToolPoint = Point3 & {
  f: number;
};

export type Segment = {
  id: number;
  mode: MotionMode;
  start: ToolPoint;
  end: ToolPoint;
  feed: number;
  lineNumber: number;
  raw: string;
  isCutting: boolean;
};

export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

export type ParsedStats = {
  totalLines: number;
  totalMoves: number;
  rapidMoves: number;
  workMoves: number;
  cuttingMoves: number;
  renderMoves: number;
  renderStep: number;
};

export type ParsedGCode = {
  segments: Segment[];
  renderSegments: Segment[];
  bounds: Bounds;
  stats: ParsedStats;
  cumulativeLengths: number[];
  totalLength: number;
};

export type StockDimensions = {
  width: number;
  height: number;
  thickness: number;
};

export type CurrentState = {
  index: number;
  position: Point3;
  mode: MotionMode | "-";
  lineNumber: number;
  segment: Segment | null;
};

export type CameraInfo = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};
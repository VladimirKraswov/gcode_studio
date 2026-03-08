// =============================
// FILE: src/modules/cad/model/types.ts
// =============================

export type SketchShapeType =
  | "rectangle"
  | "circle"
  | "line"
  | "arc"
  | "polyline"
  | "text"
  | "svg";

export type SketchGroup = {
  id: string;
  name: string;
  collapsed?: boolean;
};

export type SketchBase = {
  id: string;
  name: string;
  cutZ?: number | null;
  strokeWidth?: number;
  visible: boolean;
  groupId: string | null;
};

export type SketchRectangle = SketchBase & {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type SketchCircle = SketchBase & {
  type: "circle";
  cx: number;
  cy: number;
  radius: number;
};

export type SketchLine = SketchBase & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SketchArc = SketchBase & {
  type: "arc";
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
};

export type SketchPolylinePoint = {
  x: number;
  y: number;
};

export type SketchPolyline = SketchBase & {
  type: "polyline";
  points: SketchPolylinePoint[];
  closed: boolean;
};

export type SketchText = SketchBase & {
  type: "text";
  x: number;
  y: number;
  text: string;
  height: number;
  letterSpacing: number;
  fontFile: string;
  rotation?: number;
  align?: "left" | "center" | "right";
  cutMode?: "outline" | "pocket";
};

export type SketchSvg = SketchBase & {
  type: "svg";
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  preserveAspectRatio: boolean;
  contours: SketchPolylinePoint[][];
  rotation?: number;
};

export type SketchShape =
  | SketchRectangle
  | SketchCircle
  | SketchLine
  | SketchArc
  | SketchPolyline
  | SketchText
  | SketchSvg;

export type MachineToolType = "router" | "spindle" | "laser" | "drag-knife";
export type UnitsMode = "mm" | "inch";
export type SpindleDirection = "cw" | "ccw";

export type ConstraintEdge = "left" | "right" | "top" | "bottom";
export type MirrorAxis = "x" | "y";

export type SketchDistanceConstraintTarget =
  | {
      kind: "sheet";
    }
  | {
      kind: "shape";
      shapeId: string;
    };

export type SketchDistanceConstraint = {
  id: string;
  name?: string;
  enabled: boolean;
  shapeId: string;
  edge: ConstraintEdge;
  target: SketchDistanceConstraintTarget;
  targetEdge: ConstraintEdge;
  distance: number;
};

export type SketchDocument = {
  width: number;
  height: number;

  units: UnitsMode;
  workOffset: "G54" | "G55" | "G56" | "G57" | "G58" | "G59";

  startZ: number;
  safeZ: number;
  cutZ: number;
  passDepth: number;

  feedCut: number;
  feedPlunge: number;
  feedRapid: number;

  spindleOn: boolean;
  spindleSpeed: number;
  spindleDirection: SpindleDirection;
  laserPower: number;
  dwellMs: number;
  coolant: boolean;
  returnHome: boolean;

  toolType: MachineToolType;
  toolNumber: number;
  toolDiameter: number;
  stepover: number;

  snapEnabled: boolean;
  snapStep: number;
  shapes: SketchShape[];
  groups: SketchGroup[];
  constraints: SketchDistanceConstraint[];
};

export type SketchTool =
  | "select"
  | "rectangle"
  | "circle"
  | "line"
  | "arc"
  | "polyline"
  | "text"
  | "pan";
export type SketchShapeType = "rectangle" | "circle" | "polyline" | "text";

export type SketchBase = {
  id: string;
  name: string;
  cutZ?: number | null;
  strokeWidth?: number;
};

export type SketchRectangle = SketchBase & {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SketchCircle = SketchBase & {
  type: "circle";
  cx: number;
  cy: number;
  radius: number;
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

export type SketchShape =
  | SketchRectangle
  | SketchCircle
  | SketchPolyline
  | SketchText;

export type MachineToolType = "router" | "spindle" | "laser" | "drag-knife";
export type UnitsMode = "mm" | "inch";
export type SpindleDirection = "cw" | "ccw";

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
};

export type SketchTool =
  | "select"
  | "rectangle"
  | "circle"
  | "polyline"
  | "text"
  | "pan";
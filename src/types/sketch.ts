export type SketchShapeType = "rectangle" | "circle" | "polyline" | "text";

export type SketchBase = {
  id: string;
  name: string;
  cutZ?: number | null;
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

export type SketchDocument = {
  width: number;
  height: number;
  safeZ: number;
  cutZ: number;
  feedCut: number;
  feedRapid: number;
  spindleOn: boolean;
  laserPower: number;
  shapes: SketchShape[];
};

export type SketchTool =
  | "select"
  | "rectangle"
  | "circle"
  | "polyline"
  | "text"
  | "pan";
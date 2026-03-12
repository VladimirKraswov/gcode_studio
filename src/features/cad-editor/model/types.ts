export type SketchPolylinePoint = {
  x: number;
  y: number;
};

export type SketchPoint = {
  id: string;
  x: number;
  y: number;
  isFixed?: boolean;
};

export type SketchParameter = {
  id: string;
  name: string;
  value: number;
  expression?: string;
};

export type ConstraintEdge = "left" | "right" | "top" | "bottom";

export type SketchConstraintType =
  | "coincident"
  | "horizontal"
  | "vertical"
  | "parallel"
  | "perpendicular"
  | "tangent"
  | "equal"
  | "symmetric"
  | "distance"
  | "distance-x"
  | "distance-y"
  | "angle"
  | "radius"
  | "diameter"
  | "lock"
  | "point-on-object"
  | "midpoint"
  | "collinear";

export type SketchConstraintTarget =
  | { kind: "point"; pointId: string }
  | { kind: "shape"; shapeId: string }
  | { kind: "line"; shapeId: string }
  | { kind: "circle"; shapeId: string }
  | { kind: "arc"; shapeId: string };

export type SketchConstraint = {
  id: string;
  type: SketchConstraintType;
  targets: SketchConstraintTarget[];
  value?: number;
  parameterId?: string;
  enabled: boolean;
  driven?: boolean;
  labelX?: number;
  labelY?: number;
};

export type SketchLinearArrayParams = {
  count: number;
  spacing: number;
  axis: "x" | "y" | string;
  direction: "positive" | "negative" | "both";
  gridSecondAxis?: {
    count: number;
    spacing: number;
    axis: "x" | "y" | string;
  };
};

export type SketchCircularArrayParams = {
  count: number;
  centerX: number | string;
  centerY: number | string;
  centerPointId?: string;
  radius: number;
  startAngle: number;
  endAngle: number;
  totalAngle: number;
  rotateItems: boolean;
  direction: "cw" | "ccw";
};

export type SketchArrayDefinition =
  | {
      type: "linear";
      sourceShapeIds: string[];
      params: SketchLinearArrayParams;
    }
  | {
      type: "circular";
      sourceShapeIds: string[];
      params: SketchCircularArrayParams;
    };

export type SketchGroup = {
  id: string;
  name: string;
  collapsed?: boolean;
  array?: SketchArrayDefinition | null;
};

export type CamOperationType =
  | "follow-path"
  | "profile-inside"
  | "profile-outside"
  | "pocket";

export type CamCutDirection = "climb" | "conventional";

export type CamTabsSettings = {
  enabled: boolean;
  count: number;
  width: number;
  height: number;
};

export type CamRampingSettings = {
  enabled: boolean;
  turns: number;
};

export type SketchCamSettings = {
  operation: CamOperationType;
  direction: CamCutDirection;
  stepdown: number | null;
  stepover: number | null;
  tabs: CamTabsSettings;
  ramping: CamRampingSettings;
};

export type SketchBase = {
  id: string;
  type: string;
  name: string;
  cutZ?: number | null;
  strokeWidth?: number;
  visible: boolean;
  isConstruction?: boolean;
  groupId: string | null;
  camSettings?: Partial<SketchCamSettings>;
};

export type SketchRectangle = SketchBase & {
  type: "rectangle";
  p1: string;
  p2: string;
  rotation?: number;
};

export type SketchCircle = SketchBase & {
  type: "circle";
  center: string;
  radius: number;
  radiusPoint?: string;
};

export type SketchLine = SketchBase & {
  type: "line";
  p1: string;
  p2: string;
};

export type SketchArc = SketchBase & {
  type: "arc";
  center: string;
  p1: string;
  p2: string;
  clockwise: boolean;
  radius: number;
};

export type SketchEllipse = SketchBase & {
  type: "ellipse";
  center: string;
  majorAxisPoint: string;
  minorAxisRadius: number;
};

export type SketchEllipseArc = SketchBase & {
  type: "ellipse-arc";
  center: string;
  majorAxisPoint: string;
  minorAxisRadius: number;
  startAngle: number;
  endAngle: number;
};

export type SketchPolyline = SketchBase & {
  type: "polyline";
  pointIds: string[];
  closed: boolean;
};

export type SketchBSpline = SketchBase & {
  type: "bspline";
  controlPointIds: string[];
  degree: number;
  periodic: boolean;
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
  scale?: number;
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
  contours: string[][];
  rotation?: number;
  scale?: number;
};

export interface CadShapeRegistry {
  rectangle: SketchRectangle;
  circle: SketchCircle;
  line: SketchLine;
  arc: SketchArc;
  ellipse: SketchEllipse;
  "ellipse-arc": SketchEllipseArc;
  polyline: SketchPolyline;
  bspline: SketchBSpline;
  text: SketchText;
  svg: SketchSvg;
}

export type SketchShapeType = keyof CadShapeRegistry;
export type SketchShape = CadShapeRegistry[keyof CadShapeRegistry];

export type MachineToolType = "router" | "spindle" | "laser" | "drag-knife";
export type UnitsMode = "mm" | "inch";
export type SpindleDirection = "cw" | "ccw";

export type MirrorAxis = "x" | "y";

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

  defaultCamSettings: SketchCamSettings;

  snapEnabled: boolean;
  snapStep: number;

  points: SketchPoint[];
  shapes: SketchShape[];
  groups: SketchGroup[];
  constraints: SketchConstraint[];
  parameters: SketchParameter[];
};

export interface CadToolRegistry {
  select: { id: "select" };
  rectangle: { id: "rectangle" };
  circle: { id: "circle" };
  line: { id: "line" };
  arc: { id: "arc" };
  polyline: { id: "polyline" };
  ellipse: { id: "ellipse" };
  bspline: { id: "bspline" };
  text: { id: "text" };
  pan: { id: "pan" };
  trim: { id: "trim" };
  extend: { id: "extend" };
  mirror: { id: "mirror" };
  offset: { id: "offset" };
  fillet: { id: "fillet" };
  chamfer: { id: "chamfer" };
}

export type SketchTool = keyof CadToolRegistry;

export type SketchSelectionRef =
  | { kind: "shape"; id: string }
  | { kind: "point"; id: string }
  | { kind: "constraint"; id: string };
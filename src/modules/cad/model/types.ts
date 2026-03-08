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

export type SketchLinearArrayParams = {
  count: number;          // общее количество копий (включая оригинал)
  spacing: number;        // расстояние между копиями
  axis: "x" | "y";        // ось, вдоль которой размещаются копии
  direction: "positive" | "negative"; // направление относительно оригинала
};

export type SketchCircularArrayParams = {
  count: number;          // общее количество копий
  centerX: number;        // центр окружности
  centerY: number;
  radius: number;         // радиус окружности (расстояние от центра до центров объектов)
  totalAngle: number;     // полный угол, на который размещаются копии (обычно 360)
  rotateItems: boolean;   // поворачивать ли объекты вслед за окружностью
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


// Настройки CAM для фигуры
export type CamOperationType =
  | "follow-path"          // обычное движение по контуру (без смещения)
  | "profile-inside"       // обработка внутри контура (отверстие)
  | "profile-outside"      // обработка снаружи контура (внешний обход)
  | "pocket";              // зачистка области (карман)

export type CamCutDirection = "climb" | "conventional";

export type CamTabsSettings = {
  enabled: boolean;
  count: number;
  width: number;
  height: number;
};

export type CamRampingSettings = {
  enabled: boolean;
  turns: number;           // количество витков спирали для выхода на глубину
};

export type SketchCamSettings = {
  operation: CamOperationType;
  direction: CamCutDirection;
  stepdown: number | null;     // если null, используется глобальный passDepth
  stepover: number | null;     // если null, используется глобальный stepover
  tabs: CamTabsSettings;
  ramping: CamRampingSettings;
};

export type SketchBase = {
  id: string;
  name: string;
  cutZ?: number | null;
  strokeWidth?: number;
  visible: boolean;
  groupId: string | null;
  camSettings?: Partial<SketchCamSettings>; // индивидуальные настройки CAM
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

  defaultCamSettings: SketchCamSettings;

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





  


  





  
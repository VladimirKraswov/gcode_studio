export type Point = {
  x: number;
  y: number;
};

export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type Polyline = Point[];
export type Contour = Point[];

export type Units = "mm" | "inch";
export type JoinType = "round" | "miter";
export type PocketStrategy = "auto" | "offset" | "parallel";
export type CamOperation =
  | "follow-path"
  | "profile-inside"
  | "profile-outside"
  | "pocket";

export type Tool = {
  diameter: number;
  passDepth: number;
  stepover: number;
};

export type SpindleSettings = {
  enabled: boolean;
  speed: number;
  direction?: "cw" | "ccw";
  dwellMs?: number;
};

export type MachineSettings = {
  units: Units;
  safeZ: number;
  startZ: number;
  feedRapid: number;
  feedCut: number;
  feedPlunge: number;
  spindle?: SpindleSettings;
  coolant?: boolean;
  workOffset?: string;
  toolNumber?: number;
  returnHome?: boolean;
};

export type TabsConfig = {
  enabled: boolean;
  count: number;
  width: number;
  height: number;
};

export type RampingConfig = {
  enabled: boolean;
  turns: number;
};

export type LeadConfig = {
  enabled: boolean;
  length: number;
};

export type Toolpath = {
  name: string;
  points: Point3D[];
  closed: boolean;
  cutZ: number;
  kind?: "contour" | "pocket" | "path";
  stepdown?: number;
  tabs?: TabsConfig;
  ramping?: RampingConfig;
  leadIn?: LeadConfig;
  leadOut?: LeadConfig;
};

export type PlanOptions = {
  name?: string;
  cutZ: number;
  joinType?: JoinType;
  miterLimit?: number;
  direction?: "climb" | "conventional";
  offsetMode?: "tool-center" | "geometry";
  tabs?: Partial<TabsConfig>;
  ramping?: Partial<RampingConfig>;
  leadIn?: Partial<LeadConfig>;
  leadOut?: Partial<LeadConfig>;
};

export type ProfilePlanInput = {
  contour: Contour;
  operation: Extract<CamOperation, "follow-path" | "profile-inside" | "profile-outside">;
  tool: Tool;
  options: PlanOptions;
};

export type PocketPlanInput = {
  contours: Contour[];
  tool: Tool;
  options: PlanOptions & {
    strategy?: PocketStrategy;
    angle?: number;
  };
};

export type GCodeGeneratorInput = {
  toolpaths: Toolpath[];
  machine: MachineSettings;
};
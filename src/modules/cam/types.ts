export type ToolpathPoint = {
  x: number;
  y: number;
  z?: number;
};

export type Toolpath = {
  name: string;
  points: ToolpathPoint[];
  closed: boolean;
  cutZ: number;
  kind?: "contour" | "pocket";
  useRamping?: boolean;
  useBridges?: boolean;
  bridgeCount?: number;
  bridgeWidth?: number;
  bridgeHeight?: number;
  rampTurns?: number;
  stepdown?: number;

  leadIn?: {
    enabled: boolean;
    length: number;
  };

  leadOut?: {
    enabled: boolean;
    length: number;
  };
};

export type PlannedPath = {
  name: string;
  points: ToolpathPoint[];
  closed: boolean;
  depth: number;
};

export type PlannedOperation = {
  shapeId: string;
  shapeName: string;
  paths: PlannedPath[];
};
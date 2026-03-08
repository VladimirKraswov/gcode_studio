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
  // дополнительные поля для управления
  kind?: "contour" | "pocket";
  useRamping?: boolean;
  useBridges?: boolean;
  bridgeCount?: number;
  bridgeWidth?: number;
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
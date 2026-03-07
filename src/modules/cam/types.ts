export type ToolpathPoint = { x: number; y: number };

export type Toolpath = {
  name: string;
  points: ToolpathPoint[];
  closed: boolean;
  cutZ: number;
};
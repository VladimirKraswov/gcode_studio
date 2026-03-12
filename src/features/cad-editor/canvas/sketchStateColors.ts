import type { SketchSolveState } from "../model/solver/diagnostics";

export type SketchStrokePalette = {
  stroke: string;
  selectedStroke: string;
  constructionStroke: string;
  constructionSelectedStroke: string;
  constraintFill: string;
  constraintStroke: string;
  constraintText: string;
  pointFill: string;
};

export function getSketchStrokePalette(solveState?: SketchSolveState): SketchStrokePalette {
  switch (solveState) {
    case "well-defined":
      return {
        stroke: "#22c55e",
        selectedStroke: "#16a34a",
        constructionStroke: "#4ade80",
        constructionSelectedStroke: "#16a34a",
        constraintFill: "#dcfce7",
        constraintStroke: "#16a34a",
        constraintText: "#166534",
        pointFill: "#22c55e",
      };

    case "underdefined":
      return {
        stroke: "#facc15",
        selectedStroke: "#eab308",
        constructionStroke: "#fde047",
        constructionSelectedStroke: "#eab308",
        constraintFill: "#fef9c3",
        constraintStroke: "#eab308",
        constraintText: "#854d0e",
        pointFill: "#facc15",
      };

    case "overdefined":
    case "conflicting":
      return {
        stroke: "#ef4444",
        selectedStroke: "#dc2626",
        constructionStroke: "#f87171",
        constructionSelectedStroke: "#dc2626",
        constraintFill: "#fee2e2",
        constraintStroke: "#dc2626",
        constraintText: "#7f1d1d",
        pointFill: "#ef4444",
      };

    default:
      return {
        stroke: "",
        selectedStroke: "",
        constructionStroke: "",
        constructionSelectedStroke: "",
        constraintFill: "",
        constraintStroke: "",
        constraintText: "",
        pointFill: "",
      };
  }
}

export function resolveShapeStrokeColor(params: {
  solveState?: SketchSolveState;
  isConstruction?: boolean;
  isSelected?: boolean;
  fallbackStroke: string;
  fallbackSelectedStroke: string;
  fallbackConstructionStroke?: string;
  fallbackConstructionSelectedStroke?: string;
}): string {
  const {
    solveState,
    isConstruction = false,
    isSelected = false,
    fallbackStroke,
    fallbackSelectedStroke,
    fallbackConstructionStroke = "#3b82f6",
    fallbackConstructionSelectedStroke = "#60a5fa",
  } = params;

  const palette = getSketchStrokePalette(solveState);

  if (!palette.stroke) {
    if (isConstruction) {
      return isSelected ? fallbackConstructionSelectedStroke : fallbackConstructionStroke;
    }
    return isSelected ? fallbackSelectedStroke : fallbackStroke;
  }

  if (isConstruction) {
    return isSelected ? palette.constructionSelectedStroke : palette.constructionStroke;
  }

  return isSelected ? palette.selectedStroke : palette.stroke;
}
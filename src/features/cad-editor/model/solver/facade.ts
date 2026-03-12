import type { SketchDocument } from "../types";
import { analyzeSketchDiagnostics } from "./diagnostics";
import { solveConstraints } from "./newton";

export function solveSketch(document: SketchDocument): SketchDocument {
  return {
    ...document,
    points: solveConstraints(
      document.points,
      document.constraints,
      document.shapes,
    ),
  };
}

export function analyzeSketch(document: SketchDocument) {
  return analyzeSketchDiagnostics(document);
}
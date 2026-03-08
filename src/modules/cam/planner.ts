import type { SketchDocument } from "../cad/model/types";
import type { PlannedOperation, PlannedPath } from "./types";
import { planDocumentToolpaths } from "./planning/documentPlanner";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function buildDepths(finalCutZ: number, passDepth: number): number[] {
  if (finalCutZ >= 0) {
    return [round(finalCutZ)];
  }

  const step = Math.max(0.001, Math.abs(passDepth));
  const depths: number[] = [];

  let current = -step;
  while (current > finalCutZ) {
    depths.push(round(current));
    current -= step;
  }

  depths.push(round(finalCutZ));
  return Array.from(new Set(depths));
}

export async function planDocumentOperations(doc: SketchDocument): Promise<PlannedOperation[]> {
  const toolpaths = await planDocumentToolpaths(doc);
  const grouped = new Map<string, PlannedOperation>();

  toolpaths.forEach((toolpath, index) => {
    const shapeId = `toolpath_${index}`;
    const shapeName = toolpath.name;
    const passDepth = toolpath.stepdown ?? doc.passDepth;
    const depths = buildDepths(toolpath.cutZ, passDepth);

    const paths: PlannedPath[] = depths.map((depth) => ({
      name: `${toolpath.name} @ Z${depth}`,
      points: toolpath.points.map((p) => ({ ...p })),
      closed: toolpath.closed,
      depth,
    }));

    grouped.set(shapeId, {
      shapeId,
      shapeName,
      paths,
    });
  });

  return Array.from(grouped.values());
}
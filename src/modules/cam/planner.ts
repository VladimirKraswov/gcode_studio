import type { SketchDocument } from "../cad/model/types";
import { collectVisibleShapes } from "../cad/model/grouping";
import { shapeToToolpaths } from "./gcode/shapeToToolpath";
import type { PlannedOperation, PlannedPath, Toolpath, ToolpathPoint } from "./types";

function round(value: number): number {
  return Number(value.toFixed(3));
}

function distance(a: ToolpathPoint, b: ToolpathPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function orientPathFromNearest(
  points: ToolpathPoint[],
  current: ToolpathPoint,
  closed: boolean,
): ToolpathPoint[] {
  if (points.length <= 1) return points;

  const start = points[0];
  const end = points[points.length - 1];

  if (!closed && distance(end, current) < distance(start, current)) {
    return [...points].reverse();
  }

  return points;
}

type OrderedPlannedPath = PlannedPath & {
  shapeId: string;
  shapeName: string;
};

function orderPathsNearest(
  paths: OrderedPlannedPath[],
  start: ToolpathPoint,
): OrderedPlannedPath[] {
  const pending = [...paths];
  const result: OrderedPlannedPath[] = [];
  let current = start;

  while (pending.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < pending.length; i += 1) {
      const candidate = pending[i];
      const oriented = orientPathFromNearest(candidate.points, current, candidate.closed);
      const d = distance(current, oriented[0]);

      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }

    const picked = pending.splice(bestIndex, 1)[0];
    const orientedPoints = orientPathFromNearest(picked.points, current, picked.closed);
    const finalPath: OrderedPlannedPath = { ...picked, points: orientedPoints };

    result.push(finalPath);
    current = orientedPoints[orientedPoints.length - 1];
  }

  return result;
}

function toolpathsToPlannedPaths(toolpaths: Toolpath[], doc: SketchDocument): PlannedPath[] {
  const planned: PlannedPath[] = [];

  for (const toolpath of toolpaths) {
    const depths = buildDepths(toolpath.cutZ, doc.passDepth);

    for (const depth of depths) {
      planned.push({
        name: `${toolpath.name} @ Z${depth}`,
        points: toolpath.points.map((p) => ({ ...p })),
        closed: toolpath.closed,
        depth,
      });
    }
  }

  return planned;
}

export async function planDocumentOperations(doc: SketchDocument): Promise<PlannedOperation[]> {
  const visibleShapes = collectVisibleShapes(doc);
  const operations: PlannedOperation[] = [];

  for (const shape of visibleShapes) {
    const toolpaths = await shapeToToolpaths(shape, doc);
    const plannedPaths = toolpathsToPlannedPaths(toolpaths, doc);

    operations.push({
      shapeId: shape.id,
      shapeName: shape.name,
      paths: plannedPaths,
    });
  }

  const allPaths: OrderedPlannedPath[] = operations.flatMap((op) =>
    op.paths.map((path) => ({
      ...path,
      shapeId: op.shapeId,
      shapeName: op.shapeName,
    })),
  );

  const ordered = orderPathsNearest(allPaths, { x: 0, y: 0 });

  const grouped = new Map<string, PlannedOperation>();

  for (const path of ordered) {
    const key = path.shapeId;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        shapeId: path.shapeId,
        shapeName: path.shapeName,
        paths: [
          {
            name: path.name,
            points: path.points,
            closed: path.closed,
            depth: path.depth,
          },
        ],
      });
      continue;
    }

    existing.paths.push({
      name: path.name,
      points: path.points,
      closed: path.closed,
      depth: path.depth,
    });
  }

  return Array.from(grouped.values());
}
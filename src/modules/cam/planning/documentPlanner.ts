import type { SketchDocument, SketchShape } from "../../cad/model/types";
import { collectVisibleShapes } from "../../cad/model/grouping";
import { optimizeTravel } from "../algorithms/travelOptimizer";
import type { Toolpath } from "../types";
import { extractShapeContours } from "./shapeGeometry";
import { planContourOperationFromGeometry } from "./operationPlanner";

function buildShapeLabel(shape: SketchShape): string {
  return `${shape.type}:${shape.name}:${shape.id}`;
}

function renumberToolpaths(toolpaths: Toolpath[]): Toolpath[] {
  return toolpaths.map((toolpath, index) => ({
    ...toolpath,
    name: `${String(index + 1).padStart(3, "0")} ${toolpath.name}`,
  }));
}

export async function planDocumentToolpaths(doc: SketchDocument): Promise<Toolpath[]> {
  const visibleShapes = collectVisibleShapes(doc);
  const rawToolpaths: Array<
    Toolpath & {
      __shapeOrder: number;
      __shapeLabel: string;
      __contourOrder: number;
      __localOrder: number;
    }
  > = [];

  for (let shapeIndex = 0; shapeIndex < visibleShapes.length; shapeIndex++) {
    const shape = visibleShapes[shapeIndex];
    const contours = await extractShapeContours(shape);

    for (let contourIndex = 0; contourIndex < contours.length; contourIndex++) {
      const contour = contours[contourIndex];
      const planned = planContourOperationFromGeometry(shape, doc, contour, contourIndex);

      planned.forEach((toolpath, localIndex) => {
        rawToolpaths.push({
          ...toolpath,
          __shapeOrder: shapeIndex,
          __shapeLabel: buildShapeLabel(shape),
          __contourOrder: contourIndex,
          __localOrder: localIndex,
        });
      });
    }
  }

  if (rawToolpaths.length === 0) {
    return [];
  }

  const oriented = optimizeTravel(
    rawToolpaths.map((tp) => ({
      points: tp.points.map((p) => ({ x: p.x, y: p.y })),
      closed: tp.closed,
    })),
    { x: 0, y: 0 }
  );

  const reordered = oriented.map((item) => {
    const source = rawToolpaths[item.index];

    return {
      ...source,
      points: source.points.map((p, idx) => {
        const nextPoint = item.points[idx];
        return nextPoint ? { ...p, x: nextPoint.x, y: nextPoint.y } : p;
      }),
    };
  });

  const cleaned = reordered.map(
    ({ __shapeOrder, __shapeLabel, __contourOrder, __localOrder, ...toolpath }) => toolpath
  );

  return renumberToolpaths(cleaned);
}
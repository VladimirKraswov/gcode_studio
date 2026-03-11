import { cloneShape, createPoint } from "./shapeFactory";
import { moveShape, rotateShape } from "./shapeTransforms";
import type {
  SketchArrayDefinition,
  SketchCircularArrayParams,
  SketchDocument,
  SketchLinearArrayParams,
  SketchShape,
  SketchPoint,
} from "./types";
import { createId } from "./ids";

/**
 * Rebuilds an array group parametrically.
 * Instead of static copies, it generates geometry based on source and params.
 */
export function rebuildArrayGroup(
  document: SketchDocument,
  groupId: string,
  definition: SketchArrayDefinition
): SketchDocument {
  const sourceShapes = document.shapes.filter(
    (s) => definition.sourceShapeIds.includes(s.id)
  );
  if (sourceShapes.length === 0) return document;

  // 1. Remove old generated shapes and points
  const nextShapes = document.shapes.filter(
    (s) => s.groupId !== groupId || definition.sourceShapeIds.includes(s.id)
  );

  // For simplicity in this implementation, we assume generated points have specific IDs or are managed
  // Real implementation would need a way to track points created by the array
  let nextPoints = [...document.points];

  // 2. Generate new copies
  const generatedShapes: SketchShape[] = [];
  const generatedPoints: SketchPoint[] = [];

  if (definition.type === "linear") {
    const params = definition.params;
    for (let i = 1; i < params.count; i++) {
      const offset = i * params.spacing;
      const dx = params.axis === "x" ? offset : 0;
      const dy = params.axis === "y" ? offset : 0;

      const { shapes, points } = duplicateShapesWithOffset(sourceShapes, document.points, dx, dy, groupId);
      generatedShapes.push(...shapes);
      generatedPoints.push(...points);
    }
  } else {
    // Circular
    const params = definition.params;
    const center = typeof params.centerX === "number" ? { x: params.centerX, y: params.centerY as number } :
                   document.points.find(p => p.id === params.centerX)!;

    for (let i = 1; i < params.count; i++) {
      const angle = (params.totalAngle / params.count) * i;
      const { shapes, points } = duplicateShapesWithRotation(sourceShapes, document.points, center, angle, groupId);
      generatedShapes.push(...shapes);
      generatedPoints.push(...points);
    }
  }

  return {
    ...document,
    shapes: [...nextShapes, ...generatedShapes],
    points: [...nextPoints, ...generatedPoints],
  };
}

function duplicateShapesWithOffset(
  sources: SketchShape[],
  allPoints: SketchPoint[],
  dx: number,
  dy: number,
  groupId: string
) {
  const pointMap = new Map<string, string>();
  const newPoints: SketchPoint[] = [];
  const newShapes: SketchShape[] = [];

  // Clone points
  sources.forEach(s => {
    const pids = getShapePointIds(s);
    pids.forEach(id => {
      if (!pointMap.has(id)) {
        const p = allPoints.find(pt => pt.id === id)!;
        const newP = createPoint(p.x + dx, p.y + dy);
        newPoints.push(newP);
        pointMap.set(id, newP.id);
      }
    });
  });

  // Clone shapes
  sources.forEach(s => {
    const clone = { ...s, id: createId(s.type), groupId };
    updateShapePointIds(clone, pointMap);
    newShapes.push(clone as SketchShape);
  });

  return { shapes: newShapes, points: newPoints };
}

function duplicateShapesWithRotation(
  sources: SketchShape[],
  allPoints: SketchPoint[],
  center: { x: number, y: number },
  angleDeg: number,
  groupId: string
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const pointMap = new Map<string, string>();
  const newPoints: SketchPoint[] = [];
  const newShapes: SketchShape[] = [];

  sources.forEach(s => {
    const pids = getShapePointIds(s);
    pids.forEach(id => {
      if (!pointMap.has(id)) {
        const p = allPoints.find(pt => pt.id === id)!;
        const s_val = Math.sin(angleRad);
        const c_val = Math.cos(angleRad);
        const x = p.x - center.x;
        const y = p.y - center.y;
        const newP = createPoint(
          x * c_val - y * s_val + center.x,
          x * s_val + y * c_val + center.y
        );
        newPoints.push(newP);
        pointMap.set(id, newP.id);
      }
    });
  });

  sources.forEach(s => {
    const clone = { ...s, id: createId(s.type), groupId };
    updateShapePointIds(clone, pointMap);
    newShapes.push(clone as SketchShape);
  });

  return { shapes: newShapes, points: newPoints };
}

function getShapePointIds(s: SketchShape): string[] {
  const ids: string[] = [];
  if ("p1" in s) ids.push(s.p1);
  if ("p2" in s) ids.push(s.p2);
  if ("center" in s) ids.push(s.center);
  if ("anchorPoint" in s) ids.push(s.anchorPoint);
  if ("pointIds" in s) ids.push(...s.pointIds);
  if ("controlPointIds" in s) ids.push(...s.controlPointIds);
  if ("majorAxisPoint" in s) ids.push(s.majorAxisPoint);
  return ids;
}

function updateShapePointIds(s: any, map: Map<string, string>) {
  if ("p1" in s) s.p1 = map.get(s.p1);
  if ("p2" in s) s.p2 = map.get(s.p2);
  if ("center" in s) s.center = map.get(s.center);
  if ("anchorPoint" in s) s.anchorPoint = map.get(s.anchorPoint);
  if ("pointIds" in s) s.pointIds = s.pointIds.map((id: string) => map.get(id));
  if ("controlPointIds" in s) s.controlPointIds = s.controlPointIds.map((id: string) => map.get(id));
  if ("majorAxisPoint" in s) s.majorAxisPoint = map.get(s.majorAxisPoint);
}

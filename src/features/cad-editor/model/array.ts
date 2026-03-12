import { createPoint } from "./shapeFactory";
import type {
  SketchArrayDefinition,
  SketchCircularArrayParams,
  SketchDocument,
  SketchLinearArrayParams,
  SketchShape,
  SketchPoint,
} from "./types";
import { createId } from "./ids";

export type CircularArrayParams = SketchCircularArrayParams;
export type LinearArrayParams = SketchLinearArrayParams;

type ArrayResult = {
  document: SketchDocument;
  createdShapeIds: string[];
  groupId: string | null;
};

/**
 * Rebuilds an array group parametrically.
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

  // Identify shapes belonging to this group that are NOT the source shapes
  const shapesToRemove = document.shapes.filter(
    (s) => s.groupId === groupId && !definition.sourceShapeIds.includes(s.id)
  );
  const shapeIdsToRemove = new Set(shapesToRemove.map(s => s.id));

  // Identify points that were exclusively used by the removed shapes
  const usedPointIds = new Set<string>();
  document.shapes.forEach(s => {
    if (!shapeIdsToRemove.has(s.id)) {
      getShapePointIds(s).forEach(id => usedPointIds.add(id));
    }
  });

  const nextShapes = document.shapes.filter(s => !shapeIdsToRemove.has(s.id));
  const nextPoints = document.points.filter(p => usedPointIds.has(p.id) || isSourcePoint(p.id, sourceShapes));

  const generatedShapes: SketchShape[] = [];
  const generatedPoints: SketchPoint[] = [];

  const getAxisVector = (axis: string) => {
    let ux = 1, uy = 0;
    if (axis === "y") { ux = 0; uy = 1; }
    else if (axis.includes(",")) {
      const parts = axis.split(",");
      ux = Number(parts[0]) || 0;
      uy = Number(parts[1]) || 0;
      const mag = Math.sqrt(ux * ux + uy * uy) || 1;
      ux /= mag; uy /= mag;
    }
    return { ux, uy };
  };

  if (definition.type === "linear") {
    const params = definition.params;
    const count1 = Math.max(1, params.count);
    const axis1 = getAxisVector(params.axis);

    const count2 = params.gridSecondAxis ? Math.max(1, params.gridSecondAxis.count) : 1;
    const axis2 = params.gridSecondAxis ? getAxisVector(params.gridSecondAxis.axis) : { ux: 0, uy: 1 };
    const spacing2 = params.gridSecondAxis?.spacing ?? 0;

    const dirs1 = params.direction === "both" ? [-1, 1] : [params.direction === "negative" ? -1 : 1];

    for (const d1 of dirs1) {
      for (let i = 0; i < count1; i++) {
        for (let j = 0; j < count2; j++) {
          if (i === 0 && j === 0 && d1 === dirs1[0]) continue; // Skip original

          // If we are in "both" mode, we skip i=0 for the second direction to avoid duplicates
          if (params.direction === "both" && d1 === 1 && i === 0) continue;

          const offset1 = i * params.spacing * d1;
          const offset2 = j * spacing2;

          const dx = axis1.ux * offset1 + axis2.ux * offset2;
          const dy = axis1.uy * offset1 + axis2.uy * offset2;

          const { shapes, points } = duplicateShapesWithOffset(sourceShapes, document.points, dx, dy, groupId);
          generatedShapes.push(...shapes);
          generatedPoints.push(...points);
        }
      }
    }
  } else {
    const params = definition.params;
    const count = Math.max(1, params.count);
    const center = typeof params.centerX === "number" ? { x: params.centerX, y: params.centerY as number } :
                   document.points.find(p => p.id === params.centerX) || { x: 0, y: 0 };

    const totalAngle = params.totalAngle || 360;
    const stepAngle = totalAngle / count;
    const directionMult = params.direction === "ccw" ? 1 : -1;

    for (let i = 1; i < count; i++) {
      const angle = stepAngle * i * directionMult;

      let result;
      if (params.rotateItems) {
        result = duplicateShapesWithRotation(sourceShapes, document.points, center, angle, groupId);
      } else {
        // Translate without rotation
        const angleRad = (angle * Math.PI) / 180;
        const s_val = Math.sin(angleRad);
        const c_val = Math.cos(angleRad);

        const sourcePids = sourceShapes.flatMap(s => getShapePointIds(s));
        const sourcePts = sourcePids.map(id => document.points.find(p => p.id === id)!).filter(Boolean);
        const bx = sourcePts.reduce((sum, p) => sum + p.x, 0) / (sourcePts.length || 1);
        const by = sourcePts.reduce((sum, p) => sum + p.y, 0) / (sourcePts.length || 1);

        const rx = bx - center.x;
        const ry = by - center.y;

        const targetX = rx * c_val - ry * s_val + center.x;
        const targetY = rx * s_val + ry * c_val + center.y;

        result = duplicateShapesWithOffset(sourceShapes, document.points, targetX - bx, targetY - by, groupId);
      }

      generatedShapes.push(...result.shapes);
      generatedPoints.push(...result.points);
    }
  }

  return {
    ...document,
    shapes: [...nextShapes, ...generatedShapes],
    points: [...nextPoints, ...generatedPoints],
  };
}

export function applyLinearArray(
  document: SketchDocument,
  selection: { ids: string[] },
  params: SketchLinearArrayParams
): ArrayResult {
  const groupId = createId("group");
  const definition: SketchArrayDefinition = {
    type: "linear",
    sourceShapeIds: [...selection.ids],
    params
  };

  const nextDoc = {
    ...document,
    groups: [...document.groups, { id: groupId, name: "Linear Array", array: definition }],
    shapes: document.shapes.map(s => selection.ids.includes(s.id) ? { ...s, groupId } : s)
  };

  const finalDoc = rebuildArrayGroup(nextDoc, groupId, definition);

  return {
    document: finalDoc,
    createdShapeIds: finalDoc.shapes.filter(s => s.groupId === groupId && !selection.ids.includes(s.id)).map(s => s.id),
    groupId
  };
}

export function applyCircularArray(
  document: SketchDocument,
  selection: { ids: string[] },
  params: SketchCircularArrayParams
): ArrayResult {
  const groupId = createId("group");
  const definition: SketchArrayDefinition = {
    type: "circular",
    sourceShapeIds: [...selection.ids],
    params
  };

  const nextDoc = {
    ...document,
    groups: [...document.groups, { id: groupId, name: "Circular Array", array: definition }],
    shapes: document.shapes.map(s => selection.ids.includes(s.id) ? { ...s, groupId } : s)
  };

  const finalDoc = rebuildArrayGroup(nextDoc, groupId, definition);

  return {
    document: finalDoc,
    createdShapeIds: finalDoc.shapes.filter(s => s.groupId === groupId && !selection.ids.includes(s.id)).map(s => s.id),
    groupId
  };
}

function isSourcePoint(pointId: string, sourceShapes: SketchShape[]): boolean {
  for (const s of sourceShapes) {
    if (getShapePointIds(s).includes(pointId)) return true;
  }
  return false;
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

  sources.forEach(s => {
    const pids = getShapePointIds(s);
    pids.forEach(id => {
      if (!pointMap.has(id)) {
        const p = allPoints.find(pt => pt.id === id);
        if (p) {
          const newP = createPoint(p.x + dx, p.y + dy);
          newPoints.push(newP);
          pointMap.set(id, newP.id);
        }
      }
    });
  });

  sources.forEach(s => {
    const clone = JSON.parse(JSON.stringify(s));
    clone.id = createId(s.type);
    clone.groupId = groupId;
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
        const p = allPoints.find(pt => pt.id === id);
        if (p) {
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
      }
    });
  });

  sources.forEach(s => {
    const clone = JSON.parse(JSON.stringify(s));
    clone.id = createId(s.type);
    clone.groupId = groupId;
    updateShapePointIds(clone, pointMap);
    newShapes.push(clone as SketchShape);
  });

  return { shapes: newShapes, points: newPoints };
}

function getShapePointIds(s: SketchShape): string[] {
  const ids: string[] = [];
  const shape = s as any;
  if ("p1" in shape) ids.push(shape.p1);
  if ("p2" in shape) ids.push(shape.p2);
  if ("center" in shape) ids.push(shape.center);
  if ("pointIds" in shape && Array.isArray(shape.pointIds)) ids.push(...shape.pointIds);
  if ("controlPointIds" in shape && Array.isArray(shape.controlPointIds)) ids.push(...shape.controlPointIds);
  if ("majorAxisPoint" in shape) ids.push(shape.majorAxisPoint);
  if ("radiusPoint" in shape) ids.push(shape.radiusPoint);
  return ids.filter(Boolean);
}

function updateShapePointIds(s: any, map: Map<string, string>) {
  if ("p1" in s && s.p1) s.p1 = map.get(s.p1) || s.p1;
  if ("p2" in s && s.p2) s.p2 = map.get(s.p2) || s.p2;
  if ("center" in s && s.center) s.center = map.get(s.center) || s.center;
  if ("pointIds" in s && Array.isArray(s.pointIds)) {
    s.pointIds = s.pointIds.map((id: string) => map.get(id) || id);
  }
  if ("controlPointIds" in s && Array.isArray(s.controlPointIds)) {
    s.controlPointIds = s.controlPointIds.map((id: string) => map.get(id) || id);
  }
  if ("majorAxisPoint" in s && s.majorAxisPoint) s.majorAxisPoint = map.get(s.majorAxisPoint) || s.majorAxisPoint;
  if ("radiusPoint" in s && s.radiusPoint) s.radiusPoint = map.get(s.radiusPoint) || s.radiusPoint;
}

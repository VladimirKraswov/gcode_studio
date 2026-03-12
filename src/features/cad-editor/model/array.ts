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

  const shapesToRemove = document.shapes.filter(
    (s) => s.groupId === groupId && !definition.sourceShapeIds.includes(s.id)
  );
  const shapeIdsToRemove = new Set(shapesToRemove.map(s => s.id));

  const allUsedPointIds = new Set<string>();
  document.shapes.forEach(s => {
    if (!shapeIdsToRemove.has(s.id)) {
      getShapePointIds(s).forEach(id => allUsedPointIds.add(id));
    }
  });

  const nextShapes = document.shapes.filter(s => !shapeIdsToRemove.has(s.id));
  const nextPoints = document.points.filter(p => allUsedPointIds.has(p.id) || isSourcePoint(p.id, sourceShapes));

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
        const p = allPoints.find(pt => pt.id === id)!;
        const newP = createPoint(p.x + dx, p.y + dy);
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
  const shape = s as any;
  if ("p1" in shape) ids.push(shape.p1);
  if ("p2" in shape) ids.push(shape.p2);
  if ("center" in shape) ids.push(shape.center);
  if ("pointIds" in shape) ids.push(...shape.pointIds);
  if ("controlPointIds" in shape) ids.push(...shape.controlPointIds);
  if ("majorAxisPoint" in shape) ids.push(shape.majorAxisPoint);
  return ids;
}

function updateShapePointIds(s: any, map: Map<string, string>) {
  if ("p1" in s) s.p1 = map.get(s.p1);
  if ("p2" in s) s.p2 = map.get(s.p2);
  if ("center" in s) s.center = map.get(s.center);
  if ("pointIds" in s) s.pointIds = s.pointIds.map((id: string) => map.get(id));
  if ("controlPointIds" in s) s.controlPointIds = s.controlPointIds.map((id: string) => map.get(id));
  if ("majorAxisPoint" in s) s.majorAxisPoint = map.get(s.majorAxisPoint);
}

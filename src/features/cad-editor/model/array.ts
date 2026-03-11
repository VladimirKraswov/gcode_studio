import { cloneShape } from "./shapeFactory";
import { moveShape, rotateShape } from "./shapeTransforms";
import { selectionBounds } from "./shapeBounds";
import type { SelectionState } from "./selection";
import type {
  SketchArrayDefinition,
  SketchCircularArrayParams,
  SketchDocument,
  SketchGroup,
  SketchLinearArrayParams,
  SketchShape,
} from "./types";
import { createId } from "./ids";

export type LinearArrayParams = SketchLinearArrayParams;
export type CircularArrayParams = SketchCircularArrayParams;

type ArrayResult = {
  document: SketchDocument;
  createdShapeIds: string[];
  groupId: string | null;
};

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function getSelectedShapes(
  document: SketchDocument,
  selection: SelectionState,
): SketchShape[] {
  const ids = new Set(uniqueIds(selection.ids));
  return document.shapes.filter((shape) => ids.has(shape.id));
}

function getShapesByIds(document: SketchDocument, ids: string[]): SketchShape[] {
  const idSet = new Set(ids);
  return document.shapes.filter((shape) => idSet.has(shape.id));
}

function buildArrayBadgeName(sourceName: string, suffix: string): string {
  return `${sourceName} ${suffix}`;
}

function ensureArrayGroup(
  document: SketchDocument,
  selectedShapes: SketchShape[],
): {
  groupId: string;
  groupsToAdd: SketchGroup[];
  normalizedSources: SketchShape[];
} {
  const selectedGroupIds = Array.from(
    new Set(
      selectedShapes
        .map((shape) => shape.groupId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (selectedGroupIds.length === 1) {
    const existingGroup = document.groups.find(
      (group) => group.id === selectedGroupIds[0],
    );

    if (existingGroup) {
      return {
        groupId: existingGroup.id,
        groupsToAdd: [],
        normalizedSources: selectedShapes.map((shape) => ({
          ...shape,
          groupId: existingGroup.id,
        })),
      };
    }
  }

  const groupId = createId("group");

  return {
    groupId,
    groupsToAdd: [
      {
        id: groupId,
        name: `Группа ${document.groups.length + 1}`,
        collapsed: false,
        array: null,
      },
    ],
    normalizedSources: selectedShapes.map((shape) => ({
      ...shape,
      groupId,
    })),
  };
}

function getSourceAnchorCenter(sourceShapes: SketchShape[]) {
  const bounds = selectionBounds(sourceShapes);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function buildLinearCopies(
  sourceShapes: SketchShape[],
  groupId: string,
  params: LinearArrayParams,
): { shapes: SketchShape[]; ids: string[] } {
  const count = Math.max(1, Math.floor(params.count));
  const spacing = Math.abs(params.spacing);
  const sign = params.direction === "negative" ? -1 : 1;

  const createdShapes: SketchShape[] = [];
  const createdIds: string[] = [];

  for (let index = 1; index < count; index += 1) {
    const delta = spacing * index * sign;
    const dx = params.axis === "x" ? delta : 0;
    const dy = params.axis === "y" ? delta : 0;

    for (const shape of sourceShapes) {
      const clone = cloneShape(shape);
      const moved = moveShape(clone, dx, dy);

      const nextShape: SketchShape = {
        ...moved,
        name: buildArrayBadgeName(shape.name, String(index + 1)),
        groupId,
      };

      createdShapes.push(nextShape);
      createdIds.push(nextShape.id);
    }
  }

  return {
    shapes: createdShapes,
    ids: createdIds,
  };
}

function buildCircularCopies(
  sourceShapes: SketchShape[],
  groupId: string,
  params: CircularArrayParams,
): { shapes: SketchShape[]; ids: string[] } {
  const count = Math.max(1, Math.floor(params.count));
  const center = { x: params.centerX, y: params.centerY };
  const radius = Math.max(0, params.radius);

  const sourceAnchor = getSourceAnchorCenter(sourceShapes);
  const baseAngle = Math.atan2(sourceAnchor.y - center.y, sourceAnchor.x - center.x);
  const stepAngle = count <= 1 ? 0 : params.totalAngle / count;

  const createdShapes: SketchShape[] = [];
  const createdIds: string[] = [];

  for (let index = 1; index < count; index += 1) {
    const angleDeg = stepAngle * index;
    const angleRad = baseAngle + (angleDeg * Math.PI) / 180;

    const desiredAnchor = {
      x: center.x + Math.cos(angleRad) * radius,
      y: center.y + Math.sin(angleRad) * radius,
    };

    for (const shape of sourceShapes) {
      const clone = cloneShape(shape);

      const nextShape = params.rotateItems
        ? moveShape(
            rotateShape(clone, angleDeg, sourceAnchor),
            desiredAnchor.x - sourceAnchor.x,
            desiredAnchor.y - sourceAnchor.y,
          )
        : moveShape(
            clone,
            desiredAnchor.x - sourceAnchor.x,
            desiredAnchor.y - sourceAnchor.y,
          );

      const finalShape: SketchShape = {
        ...nextShape,
        name: buildArrayBadgeName(shape.name, String(index + 1)),
        groupId,
      };

      createdShapes.push(finalShape);
      createdIds.push(finalShape.id);
    }
  }

  return {
    shapes: createdShapes,
    ids: createdIds,
  };
}

function replaceShapesById(
  document: SketchDocument,
  replacements: SketchShape[],
): SketchShape[] {
  const replacementMap = new Map(replacements.map((shape) => [shape.id, shape]));
  return document.shapes.map((shape) => replacementMap.get(shape.id) ?? shape);
}

export function applyLinearArray(
  document: SketchDocument,
  selection: SelectionState,
  params: LinearArrayParams,
): ArrayResult {
  const selectedShapes = getSelectedShapes(document, selection);

  if (selectedShapes.length === 0) {
    return {
      document,
      createdShapeIds: [],
      groupId: null,
    };
  }

  const { groupId, groupsToAdd, normalizedSources } = ensureArrayGroup(
    document,
    selectedShapes,
  );

  const { shapes: createdShapes, ids: createdIds } = buildLinearCopies(
    normalizedSources,
    groupId,
    params,
  );

  const sourceIds = normalizedSources.map((shape) => shape.id);

  return {
    document: {
      ...document,
      groups: document.groups
        .map((group) =>
          group.id === groupId
            ? {
                ...group,
                array: {
                  type: "linear",
                  sourceShapeIds: sourceIds,
                  params,
                } satisfies SketchArrayDefinition,
              }
            : group,
        )
        .concat(
          groupsToAdd.map((group) => ({
            ...group,
            array: {
              type: "linear",
              sourceShapeIds: sourceIds,
              params,
            } satisfies SketchArrayDefinition,
          })),
        ),
      shapes: [
        ...replaceShapesById(document, normalizedSources),
        ...createdShapes,
      ],
    },
    createdShapeIds: createdIds,
    groupId,
  };
}

export function applyCircularArray(
  document: SketchDocument,
  selection: SelectionState,
  params: CircularArrayParams,
): ArrayResult {
  const selectedShapes = getSelectedShapes(document, selection);

  if (selectedShapes.length === 0) {
    return {
      document,
      createdShapeIds: [],
      groupId: null,
    };
  }

  const { groupId, groupsToAdd, normalizedSources } = ensureArrayGroup(
    document,
    selectedShapes,
  );

  const { shapes: createdShapes, ids: createdIds } = buildCircularCopies(
    normalizedSources,
    groupId,
    params,
  );

  const sourceIds = normalizedSources.map((shape) => shape.id);

  return {
    document: {
      ...document,
      groups: document.groups
        .map((group) =>
          group.id === groupId
            ? {
                ...group,
                array: {
                  type: "circular",
                  sourceShapeIds: sourceIds,
                  params,
                } satisfies SketchArrayDefinition,
              }
            : group,
        )
        .concat(
          groupsToAdd.map((group) => ({
            ...group,
            array: {
              type: "circular",
              sourceShapeIds: sourceIds,
              params,
            } satisfies SketchArrayDefinition,
          })),
        ),
      shapes: [
        ...replaceShapesById(document, normalizedSources),
        ...createdShapes,
      ],
    },
    createdShapeIds: createdIds,
    groupId,
  };
}

export function rebuildArrayGroup(
  document: SketchDocument,
  groupId: string,
  definition: SketchArrayDefinition,
): ArrayResult {
  const group = document.groups.find((item) => item.id === groupId);
  if (!group) {
    return {
      document,
      createdShapeIds: [],
      groupId: null,
    };
  }

  const sourceShapes = getShapesByIds(document, definition.sourceShapeIds).map((shape) => ({
    ...shape,
    groupId,
  }));

  if (sourceShapes.length === 0) {
    return {
      document,
      createdShapeIds: [],
      groupId,
    };
  }

  const sourceIdSet = new Set(definition.sourceShapeIds);

  const shapesWithoutOldCopies = document.shapes.filter((shape) => {
    if (shape.groupId !== groupId) return true;
    return sourceIdSet.has(shape.id);
  });

  const normalizedDocument: SketchDocument = {
    ...document,
    shapes: replaceShapesById(
      {
        ...document,
        shapes: shapesWithoutOldCopies,
      },
      sourceShapes,
    ),
  };

  if (definition.type === "linear") {
    const built = buildLinearCopies(sourceShapes, groupId, definition.params);

    return {
      document: {
        ...normalizedDocument,
        groups: normalizedDocument.groups.map((item) =>
          item.id === groupId ? { ...item, array: definition } : item,
        ),
        shapes: [...normalizedDocument.shapes, ...built.shapes],
      },
      createdShapeIds: built.ids,
      groupId,
    };
  }

  const built = buildCircularCopies(sourceShapes, groupId, definition.params);

  return {
    document: {
      ...normalizedDocument,
      groups: normalizedDocument.groups.map((item) =>
        item.id === groupId ? { ...item, array: definition } : item,
      ),
      shapes: [...normalizedDocument.shapes, ...built.shapes],
    },
    createdShapeIds: built.ids,
    groupId,
  };
}
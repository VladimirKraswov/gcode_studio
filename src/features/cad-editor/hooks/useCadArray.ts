import { useState, useCallback, useMemo } from "react";
import type { SketchDocument, SketchArrayDefinition, SketchLinearArrayParams, SketchCircularArrayParams } from "../model/types";
import type { SelectionState } from "../model/selection";
import { applyCircularArray, applyLinearArray, rebuildArrayGroup } from "../model/array";
import { updateGeometry } from "../model/solver/manager";
import type { ArrayToolMode } from "./types";

export function useCadArray(
  document: SketchDocument,
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>,
  selection: SelectionState,
  _onSelectionChange: (selection: SelectionState) => void,
  checkpointHistory: () => void,
) {
  const [arrayToolMode, setArrayToolMode] = useState<ArrayToolMode>(null);
  const [editingArrayGroupId, setEditingArrayGroupId] = useState<string | null>(null);

  const [linearArrayParams, setLinearArrayParamsState] = useState<SketchLinearArrayParams>({
    count: 3,
    spacing: 20,
    axis: "x",
    direction: "positive",
  });

  const [circularArrayParams, setCircularArrayParamsState] = useState<SketchCircularArrayParams>({
    count: 6,
    centerX: 0,
    centerY: 0,
    radius: 30,
    startAngle: 0,
    endAngle: 360,
    totalAngle: 360,
    rotateItems: true,
    direction: "cw",
  });

  const updateLinearArrayParams = useCallback((patch: Partial<SketchLinearArrayParams>) => {
    setLinearArrayParamsState(prev => ({ ...prev, ...patch }));
  }, []);

  const updateCircularArrayParams = useCallback((patch: Partial<SketchCircularArrayParams>) => {
    setCircularArrayParamsState(prev => ({ ...prev, ...patch }));
  }, []);

  const startLinearArray = useCallback(() => {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("linear");
  }, [selection.ids.length]);

  const startCircularArray = useCallback(() => {
    if (selection.ids.length === 0) return;
    setEditingArrayGroupId(null);
    setArrayToolMode("circular");
  }, [selection.ids.length]);

  const applyArray = useCallback(() => {
    if (selection.ids.length === 0 || !arrayToolMode) return;
    checkpointHistory();

    if (editingArrayGroupId) {
      const group = document.groups.find((item) => item.id === editingArrayGroupId);
      if (!group?.array) {
        setEditingArrayGroupId(null);
        setArrayToolMode(null);
        return;
      }

      const nextDefinition: SketchArrayDefinition =
        arrayToolMode === "linear"
          ? {
              type: "linear",
              sourceShapeIds: group.array.sourceShapeIds,
              params: linearArrayParams,
            }
          : {
              type: "circular",
              sourceShapeIds: group.array.sourceShapeIds,
              params: circularArrayParams,
            };

      setDocument(updateGeometry(rebuildArrayGroup(document, editingArrayGroupId, nextDefinition)));
      setEditingArrayGroupId(null);
      setArrayToolMode(null);
      return;
    }

    const result =
      arrayToolMode === "linear"
        ? applyLinearArray(document, selection, linearArrayParams)
        : applyCircularArray(document, selection, circularArrayParams);

    setDocument(updateGeometry(result.document));
    setEditingArrayGroupId(null);
    setArrayToolMode(null);
  }, [selection, arrayToolMode, checkpointHistory, editingArrayGroupId, document, linearArrayParams, circularArrayParams, setDocument]);

  const closeArrayTool = useCallback(() => {
    setArrayToolMode(null);
    setEditingArrayGroupId(null);
  }, []);

  const arrayTool = useMemo(() => ({
    mode: arrayToolMode,
    linear: linearArrayParams,
    circular: circularArrayParams,
    editingGroupId: editingArrayGroupId,
  }), [arrayToolMode, linearArrayParams, circularArrayParams, editingArrayGroupId]);

  const arrayPreviewShapes = useMemo(() => {
    if (!arrayToolMode || selection.ids.length === 0) return [];

    const groupId = "preview-array";
    const definition: SketchArrayDefinition =
      arrayToolMode === "linear"
        ? {
            type: "linear",
            sourceShapeIds: selection.ids,
            params: linearArrayParams,
          }
        : {
            type: "circular",
            sourceShapeIds: selection.ids,
            params: circularArrayParams,
          };

    const previewDoc = rebuildArrayGroup(
      { ...document, shapes: [...document.shapes] },
      groupId,
      definition,
    );

    return previewDoc.shapes.filter((shape) => shape.groupId === groupId);
  }, [arrayToolMode, selection.ids, document, linearArrayParams, circularArrayParams]);

  return {
    arrayTool,
    arrayPreviewShapes,
    setArrayToolMode,
    setEditingArrayGroupId,
    updateLinearArrayParams,
    updateCircularArrayParams,
    setLinearArrayParamsState,
    setCircularArrayParamsState,
    startLinearArray,
    startCircularArray,
    applyArray,
    closeArrayTool,
  };
}

import { useState, useCallback } from "react";
import i18next from "i18next";
import type { DraftShape } from "../geometry/draftGeometry";
import type { SketchPolylinePoint, SketchTool, SketchDocument, SketchBSpline } from "../model/types";
import { createDefaultTextToolState } from "../editor-state/textToolState";
import type { TextToolState } from "./types";
import { materializeSnappedPoint } from "../model/constraintFacade";
import { createPolylineShape, createBSplineShape } from "../model/shapeFactory";
import { updateGeometry } from "../model/solver/manager";
import { addShape } from "../model/document";
import { makeShapeRef, selectOnly } from "../model/selection";
import { insertBSplineControlPoint, removeBSplineControlPoint } from "../geometry/bsplineEditing";

export function useCadDrawing(
  document: SketchDocument,
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>,
  checkpointHistory: () => void,
  onSelectionChange: (selection: any) => void,
  onSelectionChangeSilently: (selection: any) => void,
) {
  const [tool, setToolState] = useState<SketchTool>("select");
  const [draft, setDraft] = useState<DraftShape>(null);
  const [polylineDraft, setPolylineDraft] = useState<SketchPolylinePoint[]>([]);
  const [polylineHoverPoint, setPolylineHoverPoint] = useState<SketchPolylinePoint | null>(null);
  const [textTool, setTextTool] = useState<TextToolState>(createDefaultTextToolState());

  const resetDrafts = useCallback(() => {
    setDraft(null);
    setPolylineDraft([]);
    setPolylineHoverPoint(null);
  }, []);

  const focusCreatedShape = useCallback((shapeId: string) => {
    setToolState("select");
    onSelectionChange(selectOnly(makeShapeRef(shapeId)));
    resetDrafts();
  }, [onSelectionChange, resetDrafts]);

  const setTool = useCallback((nextTool: SketchTool, onClearSelection: () => void) => {
    setToolState(nextTool);
    if (nextTool !== "select") {
      onClearSelection();
    }
  }, []);

  const commitPolyline = useCallback(() => {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    checkpointHistory();

    let nextDoc = { ...document };
    const pointIds: string[] = [];

    for (const draftPoint of polylineDraft) {
      const result = materializeSnappedPoint(nextDoc, draftPoint);
      nextDoc = result.document;
      pointIds.push(result.pointId);
    }

    const dedupedPointIds = pointIds.filter((id, index, arr) => index === 0 || arr[index - 1] !== id);
    if (dedupedPointIds.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    const shape = createPolylineShape(
      `${i18next.t("cad.tools.polyline")} ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      dedupedPointIds,
      false,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, polylineDraft, checkpointHistory, setDocument, focusCreatedShape]);

  const commitBSpline = useCallback(() => {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    checkpointHistory();

    let nextDoc = { ...document };
    const pointIds: string[] = [];

    for (const draftPoint of polylineDraft) {
      const result = materializeSnappedPoint(nextDoc, draftPoint);
      nextDoc = result.document;
      pointIds.push(result.pointId);
    }

    const dedupedPointIds = pointIds.filter((id, index, arr) => index === 0 || arr[index - 1] !== id);
    if (dedupedPointIds.length < 2) {
      setPolylineDraft([]);
      setPolylineHoverPoint(null);
      return;
    }

    const shape = createBSplineShape(
      `${i18next.t("cad.tools.spline")} ${document.shapes.filter((s) => s.type === "bspline").length + 1}`,
      dedupedPointIds,
    );

    setDocument(updateGeometry(addShape(nextDoc, shape)));
    focusCreatedShape(shape.id);
  }, [document, polylineDraft, checkpointHistory, setDocument, focusCreatedShape]);

  const insertControlPointToSelectedBSpline = useCallback((selection: any) => (x: number, y: number) => {
    if (!selection.primaryId) return;

    const shape = document.shapes.find((s) => s.id === selection.primaryId);
    if (!shape || shape.type !== "bspline") return;

    const result = insertBSplineControlPoint(shape, document.points, { x, y });
    if (!result) return;

    checkpointHistory();

    setDocument((prev) => ({
      ...prev,
      points: [...prev.points, result.point],
      shapes: prev.shapes.map((item) =>
        item.id === shape.id
          ? ({
              ...item,
              controlPointIds: result.nextControlPointIds,
              degree: Math.max(1, Math.min((item as SketchBSpline).degree, result.nextControlPointIds.length - 1)),
            } as SketchBSpline)
          : item,
      ),
    }));
  }, [document.shapes, document.points, checkpointHistory, setDocument]);

  const removeSelectedPointFromBSpline = useCallback((selection: any) => () => {
    if (!selection.primaryId) return;
    if (!selection.primaryId.startsWith("pt-")) return;

    const selectedPointId = selection.primaryId;
    const ownerSpline = document.shapes.find(
      (shape) =>
        shape.type === "bspline" &&
        (shape as SketchBSpline).controlPointIds.includes(selectedPointId),
    );

    if (!ownerSpline || ownerSpline.type !== "bspline") return;

    const result = removeBSplineControlPoint(ownerSpline, selectedPointId);
    if (!result) return;

    checkpointHistory();

    setDocument((prev) => {
      const nextShapes = prev.shapes.map((shape) =>
        shape.id === ownerSpline.id
          ? ({
              ...shape,
              controlPointIds: result.nextControlPointIds,
              degree: result.nextDegree,
            } as SketchBSpline)
          : shape,
      );

      const stillUsedPointIds = new Set<string>();
      nextShapes.forEach((shape) => {
        const s = shape as any;
        if (s.p1) stillUsedPointIds.add(s.p1);
        if (s.p2) stillUsedPointIds.add(s.p2);
        if (s.center) stillUsedPointIds.add(s.center);
        if (s.pointIds) s.pointIds.forEach((id: string) => stillUsedPointIds.add(id));
        if (s.controlPointIds) s.controlPointIds.forEach((id: string) => stillUsedPointIds.add(id));
        if (s.majorAxisPoint) stillUsedPointIds.add(s.majorAxisPoint);
      });

      return {
        ...prev,
        shapes: nextShapes,
        points: prev.points.filter((p) => p.id !== selectedPointId || stillUsedPointIds.has(p.id)),
      };
    });

    onSelectionChangeSilently(selectOnly(makeShapeRef(ownerSpline.id)));
  }, [document.shapes, checkpointHistory, setDocument, onSelectionChangeSilently]);

  return {
    tool,
    setTool,
    draft,
    setDraft,
    polylineDraft,
    setPolylineDraft,
    polylineHoverPoint,
    setPolylineHoverPoint,
    textTool,
    setTextTool,
    resetDrafts,
    commitPolyline,
    commitBSpline,
    focusCreatedShape,
    insertControlPointToSelectedBSpline,
    removeSelectedPointFromBSpline,
  };
}

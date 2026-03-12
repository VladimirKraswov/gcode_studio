import React from "react";
import type { CadPoint } from "@/utils/fontGeometry";
import type { ViewTransform } from "../model/view";
import type { SketchShape, SketchPoint } from "../model/types";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { useShapePlugin } from "../plugins/registry";

type ShapeRendererProps = {
  shape: SketchShape;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  textPreviewMap: Record<string, CadPoint[][]>;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
  overrideStroke?: string;
};

export function ShapeRenderer({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  textPreviewMap,
  solveState,
  onPointerDown,
  overrideStroke,
}: ShapeRendererProps) {
  const plugin = useShapePlugin(shape);

  if (!plugin) {
    console.warn(`No shape plugin registered for type "${shape.type}"`);
    return null;
  }

  const rendered = plugin.render({
    shape,
    points,
    documentHeight,
    view,
    isSelected,
    textPreviewMap,
    solveState,
    onPointerDown,
  });

  if (overrideStroke && React.isValidElement(rendered)) {
      return React.cloneElement(rendered as React.ReactElement<any>, { stroke: overrideStroke });
  }

  return <>{rendered}</>;
}
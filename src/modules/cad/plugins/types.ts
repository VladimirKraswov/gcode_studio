import type React from "react";
import type {
  SketchDocument,
  SketchShape,
  SketchTool,
} from "../model/types";
import type { ViewTransform } from "../model/view";
import type { SelectionState } from "../model/selection";
import type { Bounds2D } from "../model/shapeBounds";

export type ShapeRenderProps<TShape extends SketchShape = SketchShape> = {
  shape: TShape;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  textPreviewMap: Record<string, { x: number; y: number }[][]>;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
};

export type ShapePlugin<TShape extends SketchShape = SketchShape> = {
  type: TShape["type"];
  render: (props: ShapeRenderProps<TShape>) => React.ReactNode;
  getBounds: (shape: TShape) => Bounds2D;
  hitTest?: (
    point: { x: number; y: number },
    shape: TShape,
    tolerance: number,
  ) => boolean;
};

/**
 * "Стертый" тип для хранения в registry.
 * На границе registry мы теряем конкретный TShape,
 * а типобезопасность сохраняем через defineShapePlugin().
 */
export type AnyShapePlugin = ShapePlugin<any>;

export function defineShapePlugin<TShape extends SketchShape>(
  plugin: ShapePlugin<TShape>,
): AnyShapePlugin {
  return plugin as AnyShapePlugin;
}

export type ToolRuntime = {
  document: SketchDocument;
  selection: SelectionState;
  view: ViewTransform;
  setTool: (tool: SketchTool) => void;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onSelectionChange: (selection: SelectionState) => void;
  checkpointHistory: () => void;
};

export type ToolPlugin = {
  id: SketchTool;
  label: string;
  hint: string;
  icon: React.ReactNode;
  order?: number;
};

export type CommandPlugin = {
  id: string;
  title: string;
  run: (runtime: ToolRuntime) => void;
};

export type CadPlugin = {
  id: string;
  shapes?: AnyShapePlugin[];
  tools?: ToolPlugin[];
  commands?: CommandPlugin[];
};
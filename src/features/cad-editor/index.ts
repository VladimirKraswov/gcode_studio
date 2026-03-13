// src/modules/cad/index.ts

// Canvas
export { CadCanvas } from "./canvas/CadCanvas";

// Hooks
export { useCadEditor } from "@/features/cad-editor/hooks/useCadEditor";
export { useSvgImportFlow } from "@/features/cad-editor/hooks/useSvgImportFlow";
export { useTextPreviewMap } from "@/features/cad-editor/hooks/useTextPreviewMap";

// Panels
export { EditStatusBar } from "./panels/EditStatusBar";
export { EditToolbar } from "./panels/EditToolbar";
export { ArrayToolPanel } from "./panels/ArrayToolPanel";
export { TextToolPanel } from "./panels/TextToolPanel";
export { DocumentSettingsPanel } from "./panels/DocumentSettingsPanel";
export { IndividualCamPanel } from "./panels/IndividualCamPanel";
export { ShapePropertiesPanel } from "./panels/ShapePropertiesPanel";
export { ObjectListPanel } from "./panels/ObjectListPanel";
export { QuickConstraintBar } from "./panels/QuickConstraintBar";

// Plugins
export * from "./plugins/types";
export * from "./plugins/registry";
export * from "./plugins/defaultRegistry";

// Model
export * from "./model/types";
export * from "./model/selection";
export * from "./model/grouping";
export * from "./model/constraints";
export * from "./model/document";
export * from "./model/shapeFactory";
export * from "./model/shapeTransforms";
export * from "./model/shapeBounds";
export * from "./model/array";
export * from "./model/bspline";
export { createId } from "./model/ids";
export { createDefaultView, type ViewTransform } from "./model/view";

// Geometry utilities
export { distance } from "./geometry/distance";
export * from "./geometry/draftGeometry";
export * from "./geometry/hitTest";
export * from "./geometry/snap";
export { parseSvgToContours } from "./geometry/svgImport";
export { getTextPolylines, type CadPoint } from "./geometry/textGeometry";
export { isShapeClosed } from "./geometry/shapeContours";
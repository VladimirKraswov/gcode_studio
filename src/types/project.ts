
// =============================
// FILE: src/types/project.ts
// =============================

import type { PlacementMode, StockDimensions } from "./gcode";
import type { MainTab } from "./ui";
import type { SketchDocument } from "@/features/cad-editor/model/types";
import type { SelectionState } from "@/features/cad-editor/model/selection";
import type { ViewTransform } from "@/features/cad-editor/model/view";

export type GCodeStudioProject = {
  version: 3;
  kind: "gcode-studio-project";
  fileName: string;
  source: string;
  stock: StockDimensions;
  showMaterialRemoval: boolean;
  placementMode: PlacementMode;
  detailLevel: number;
  activeTab: MainTab;
  editDocument: SketchDocument;
  selection: SelectionState;
  cadView: ViewTransform;
};
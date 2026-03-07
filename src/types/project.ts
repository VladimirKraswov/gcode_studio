import type { PlacementMode, StockDimensions } from "./gcode";
import type { MainTab } from "./ui";
import type { SketchDocument } from "../modules/cad/model/types";
import type { SelectionState } from "../modules/cad/model/selection";
import type { ViewTransform } from "../modules/cad/model/view";

export type GCodeStudioProject = {
  version: 2;
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
import type { SketchDocument } from "../model/types";
import type { ViewTransform } from "../model/view";

type CadSheetProps = {
  document: SketchDocument;
  view: ViewTransform;
};

export function CadSheet({ document, view }: CadSheetProps) {
  return (
    <rect
      x={view.offsetX}
      y={view.offsetY}
      width={document.width * view.scale}
      height={document.height * view.scale}
      fill="rgba(255,255,255,0.86)"
      stroke="#cbd5e1"
      strokeWidth={1.5}
    />
  );
}
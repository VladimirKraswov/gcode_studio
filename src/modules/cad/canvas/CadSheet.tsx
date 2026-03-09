import { useTheme } from "../../../contexts/ThemeContext";
import type { SketchDocument } from "../model/types";
import type { ViewTransform } from "../model/view";

type CadSheetProps = {
  document: SketchDocument;
  view: ViewTransform;
};

export function CadSheet({ document, view }: CadSheetProps) {
  const { theme } = useTheme();

  return (
    <rect
      x={view.offsetX}
      y={view.offsetY}
      width={document.width * view.scale}
      height={document.height * view.scale}
      fill={theme.cad.sheetFill}
      stroke={theme.cad.sheetStroke}
      strokeWidth={1.5}
    />
  );
}
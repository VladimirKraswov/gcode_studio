import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";

type CadOriginMarkerProps = {
  documentHeight: number;
  view: ViewTransform;
};

export function CadOriginMarker({ documentHeight, view }: CadOriginMarkerProps) {
  const { theme } = useTheme();
  const origin = cadToScreenPoint({ x: 0, y: 0 }, documentHeight, view);

  return (
    <g>
      <circle cx={origin.x} cy={origin.y} r={4} fill={theme.cad.origin} />
      <text x={origin.x + 8} y={origin.y - 8} fontSize="12" fill={theme.cad.originText}>
        X0 Y0
      </text>
    </g>
  );
}
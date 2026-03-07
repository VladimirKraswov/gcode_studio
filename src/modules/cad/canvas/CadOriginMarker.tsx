import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";

type CadOriginMarkerProps = {
  documentHeight: number;
  view: ViewTransform;
};

export function CadOriginMarker({ documentHeight, view }: CadOriginMarkerProps) {
  const origin = cadToScreenPoint({ x: 0, y: 0 }, documentHeight, view);

  return (
    <g>
      <circle cx={origin.x} cy={origin.y} r={4} fill="#ef4444" />
      <text x={origin.x + 8} y={origin.y - 8} fontSize="12" fill="#0f172a">
        X0 Y0
      </text>
    </g>
  );
}

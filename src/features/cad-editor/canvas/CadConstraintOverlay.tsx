import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type {
  SketchDocument,
  SketchPoint,
  SketchConstraint,
} from "../model/types";
import type { ViewTransform } from "../model/view";

type CadConstraintOverlayProps = {
  document: SketchDocument;
  documentHeight: number;
  view: ViewTransform;
};

export function CadConstraintOverlay({
  document,
  documentHeight,
  view,
}: CadConstraintOverlayProps) {
  const { theme } = useTheme();

  return (
    <g pointerEvents="none">
      {document.constraints.map((c: SketchConstraint) => {
        const p1 = document.points.find(p => p.id === c.pointIds[0]);
        if (!p1) return null;

        const screen = cadToScreenPoint(p1, documentHeight, view);

        return (
          <g key={c.id} transform={`translate(${screen.x}, ${screen.y})`}>
            {/* Constraint Icon */}
            <rect
              x="-8"
              y="-24"
              width="16"
              height="16"
              rx="2"
              fill={theme.cad.constraintLabelFill}
              stroke={theme.cad.constraintLabelStroke}
              strokeWidth="1"
            />
            <text
              x="0"
              y="-12"
              fontSize="10"
              textAnchor="middle"
              fill={theme.cad.constraintLabelText}
              fontWeight="bold"
            >
              {getConstraintSymbol(c.type)}
            </text>
          </g>
        );
      })}

      {/* Degree of Freedom (DOF) Visualization for Points */}
      {document.points.map((p: SketchPoint) => {
        const screen = cadToScreenPoint(p, documentHeight, view);
        const isFullyConstrained = p.isFixed; // Simplified DOF check

        return (
          <circle
            key={p.id}
            cx={screen.x}
            cy={screen.y}
            r={3}
            fill={isFullyConstrained ? "#000" : "#3b82f6"}
            stroke="#fff"
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

function getConstraintSymbol(type: string): string {
  switch (type) {
    case "horizontal": return "H";
    case "vertical": return "V";
    case "coincident": return "C";
    case "parallel": return "||";
    case "perpendicular": return "⊥";
    case "equal": return "=";
    case "tangent": return "T";
    case "distance": return "D";
    default: return "?";
  }
}

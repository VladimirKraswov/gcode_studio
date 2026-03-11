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
  onPointerDown,
}: CadConstraintOverlayProps & { onPointerDown?: (e: any, id: string) => void }) {
  const { theme } = useTheme();

  // Group constraints by point for better icon placement
  const constraintsByPoint = new Map<string, SketchConstraint[]>();
  document.constraints.forEach(c => {
    if (c.pointIds.length > 0) {
      const pId = c.pointIds[0];
      const list = constraintsByPoint.get(pId) || [];
      list.push(c);
      constraintsByPoint.set(pId, list);
    }
  });

  return (
    <g pointerEvents="none">
      {Array.from(constraintsByPoint.entries()).map(([pointId, constraints]) => {
        const p1 = document.points.find(p => p.id === pointId);
        if (!p1) return null;
        const screen = cadToScreenPoint(p1, documentHeight, view);

        return (
          <g key={pointId} transform={`translate(${screen.x}, ${screen.y})`}>
            {constraints.map((c, index) => {
              const offsetX = index * 18 - (constraints.length - 1) * 9;
              const offsetY = -28;

              return (
                <g
                  key={c.id}
                  transform={`translate(${offsetX}, ${offsetY})`}
                  onPointerDown={(e) => onPointerDown?.(e, c.id)}
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                >
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    rx="3"
                    fill={theme.cad.constraintLabelFill}
                    stroke={theme.cad.constraintLabelStroke}
                    strokeWidth="1.5"
                    className="hover:stroke-primary transition-colors"
                  />
                  <text
                    x="0"
                    y="4"
                    fontSize="10"
                    textAnchor="middle"
                    fill={theme.cad.constraintLabelText}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                  >
                    {getConstraintSymbol(c.type)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Degree of Freedom (DOF) Visualization */}
      {document.points.map((p: SketchPoint) => {
        const screen = cadToScreenPoint(p, documentHeight, view);

        // Count constraints for this point
        const constraintCount = document.constraints.filter(c => c.pointIds.includes(p.id)).length;
        const isConstrained = constraintCount > 0;
        const isFixed = p.isFixed;

        return (
          <g key={p.id}>
            <circle
              cx={screen.x}
              cy={screen.y}
              r={12}
              fill="transparent"
              onPointerDown={(e) => onPointerDown?.(e, "point:" + p.id)}
              style={{ cursor: 'move', pointerEvents: 'all' }}
            />
            <circle
              cx={screen.x}
              cy={screen.y}
              r={5}
              fill={isFixed ? "#ef4444" : isConstrained ? "#22c55e" : "#3b82f6"}
              stroke="#ffffff"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          </g>
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
    case "distance-x": return "Dx";
    case "distance-y": return "Dy";
    default: return "?";
  }
}

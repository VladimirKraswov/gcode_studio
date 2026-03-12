import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type {
  SketchConstraint,
  SketchDocument,
  SketchPoint,
  SketchShape,
} from "../model/types";
import type { SelectionState } from "../model/selection";
import type { ViewTransform } from "../model/view";

type CadConstraintOverlayProps = {
  document: SketchDocument;
  documentHeight: number;
  view: ViewTransform;
  selection: SelectionState;
  onPointerDown?: (event: React.PointerEvent<SVGElement>, id: string) => void;
};

function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_");
}

function getConstraintSymbol(type: string): string {
  switch (type) {
    case "horizontal":
      return "H";
    case "vertical":
      return "V";
    case "coincident":
      return "C";
    case "parallel":
      return "||";
    case "perpendicular":
      return "⊥";
    case "equal":
      return "=";
    case "tangent":
      return "T";
    case "distance":
      return "D";
    case "distance-x":
      return "Dx";
    case "distance-y":
      return "Dy";
    case "angle":
      return "∠";
    case "radius":
      return "R";
    case "diameter":
      return "Ø";
    default:
      return "?";
  }
}

function getShapePointIds(shape: SketchShape): string[] {
  const s = shape as any;
  const ids: string[] = [];

  if (s.p1) ids.push(s.p1);
  if (s.p2) ids.push(s.p2);
  if (s.center) ids.push(s.center);
  if (s.majorAxisPoint) ids.push(s.majorAxisPoint);
  if (Array.isArray(s.pointIds)) ids.push(...s.pointIds);
  if (Array.isArray(s.controlPointIds)) ids.push(...s.controlPointIds);

  return ids;
}

export function CadConstraintOverlay({
  document,
  documentHeight,
  view,
  selection,
  onPointerDown,
}: CadConstraintOverlayProps) {
  const { theme } = useTheme();

  const selectedShapeIds = selection.ids.filter((id) => !isPointSelectionId(id));
  const selectedPointIds = selection.ids.filter((id) => isPointSelectionId(id));

  const visiblePointIds = new Set<string>();

  for (const shapeId of selectedShapeIds) {
    const shape = document.shapes.find((item) => item.id === shapeId);
    if (!shape) continue;

    if (shape.groupId) {
      const groupShapes = document.shapes.filter((item) => item.groupId === shape.groupId);
      const groupShapeIds = groupShapes.map((item) => item.id);
      const wholeGroupSelected =
        groupShapeIds.length > 0 && groupShapeIds.every((id) => selectedShapeIds.includes(id));

      if (wholeGroupSelected) {
        for (const groupShape of groupShapes) {
          for (const pointId of getShapePointIds(groupShape)) {
            visiblePointIds.add(pointId);
          }
        }
        continue;
      }
    }

    for (const pointId of getShapePointIds(shape)) {
      visiblePointIds.add(pointId);
    }
  }

  for (const pointId of selectedPointIds) {
    visiblePointIds.add(pointId);
  }

  const constraintsByPoint = new Map<string, SketchConstraint[]>();
  for (const constraint of document.constraints) {
    if (constraint.pointIds.length === 0) continue;
    const pointId = constraint.pointIds[0];
    if (!visiblePointIds.has(pointId)) continue;

    const list = constraintsByPoint.get(pointId) ?? [];
    list.push(constraint);
    constraintsByPoint.set(pointId, list);
  }

  return (
    <g>
      {Array.from(constraintsByPoint.entries()).map(([pointId, constraints]) => {
        const point = document.points.find((p) => p.id === pointId);
        if (!point) return null;

        const screen = cadToScreenPoint(point, documentHeight, view);

        return (
          <g key={`constraint-icons-${pointId}`} transform={`translate(${screen.x}, ${screen.y})`}>
            {constraints.map((constraint, index) => {
              const offsetX = index * 18 - (constraints.length - 1) * 9;
              const offsetY = -28;

              return (
                <g
                  key={constraint.id}
                  transform={`translate(${offsetX}, ${offsetY})`}
                  onPointerDown={(event) => onPointerDown?.(event, constraint.id)}
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
                  />
                  <text
                    x="0"
                    y="4"
                    fontSize="10"
                    textAnchor="middle"
                    fill={theme.cad.constraintLabelText}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{ userSelect: "none" }}
                  >
                    {getConstraintSymbol(constraint.type)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {document.points.map((point: SketchPoint) => {
        if (!visiblePointIds.has(point.id)) return null;

        const screen = cadToScreenPoint(point, documentHeight, view);
        const isSelected = selection.ids.includes(point.id);
        const constraintCount = document.constraints.filter((c) => c.pointIds.includes(point.id)).length;
        const isConstrained = constraintCount > 0;
        const isFixed = !!point.isFixed;

        return (
          <g key={`point-handle-${point.id}`}>
            <circle
              cx={screen.x}
              cy={screen.y}
              r={12}
              fill="transparent"
              onPointerDown={(event) => onPointerDown?.(event, `point:${point.id}`)}
              style={{ cursor: "move", pointerEvents: "all" }}
            />
            <circle
              cx={screen.x}
              cy={screen.y}
              r={5}
              fill={
                isSelected
                  ? theme.cad.selectedStroke
                  : isFixed
                    ? "#ef4444"
                    : isConstrained
                      ? "#22c55e"
                      : "#3b82f6"
              }
              stroke="#ffffff"
              strokeWidth={isSelected ? 2 : 1.5}
              pointerEvents="none"
            />
          </g>
        );
      })}
    </g>
  );
}
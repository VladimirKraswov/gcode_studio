import React, { useState } from "react";
import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type {
  SketchConstraint,
  SketchDocument,
  SketchPoint,
} from "../model/types";
import { DimensionDialog } from "./DimensionDialog";
import type { SelectionState } from "../model/selection";
import type { ViewTransform } from "../model/view";
import type { SketchSolveState } from "../model/solver/diagnostics";
import {
  getConstraintPointIds,
  isDimensionalConstraint,
} from "../model/constraints";

type CadConstraintOverlayProps = {
  document: SketchDocument;
  documentHeight: number;
  view: ViewTransform;
  selection: SelectionState;
  solveState?: SketchSolveState;
  conflictingConstraintIds?: string[];
  onPointerDown?: (event: React.PointerEvent<SVGElement>, id: string) => void;
  onDimensionValueChange?: (constraintId: string, value: number) => void;
  onDimensionDelete?: (constraintId: string) => void;
};

function isPointSelectionId(id: string): boolean {
  return id.startsWith("pt_") || id.startsWith("pt-");
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
    case "point-on-object":
      return "P";
    case "midpoint":
      return "M";
    case "collinear":
      return "CL";
    default:
      return "?";
  }
}

function getConstraintAnchor(
  constraint: SketchConstraint,
  document: SketchDocument,
): SketchPoint | null {
  const pointIds = getConstraintPointIds(constraint);
  if (pointIds.length === 0) return null;

  const points = pointIds
    .map((id) => document.points.find((point) => point.id === id))
    .filter((point): point is SketchPoint => !!point);

  if (points.length === 0) return null;

  const labelX =
    typeof constraint.labelX === "number"
      ? constraint.labelX
      : points.reduce((sum, point) => sum + point.x, 0) / points.length;

  const labelY =
    typeof constraint.labelY === "number"
      ? constraint.labelY
      : points.reduce((sum, point) => sum + point.y, 0) / points.length;

  return { id: "anchor", x: labelX, y: labelY };
}

function DimensionArrows({
  p1,
  p2,
  opacity,
  color,
}: {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  opacity: number;
  color: string;
}) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 10) return null;

  const unitX = dx / len;
  const unitY = dy / len;

  const arrowSize = 8;
  const arrowAngle = Math.PI / 6; // 30 degrees

  // Arrow 1 at p1
  const a1p1 = {
    x: p1.x + unitX * arrowSize * Math.cos(arrowAngle) + unitY * arrowSize * Math.sin(arrowAngle),
    y: p1.y + unitY * arrowSize * Math.cos(arrowAngle) - unitX * arrowSize * Math.sin(arrowAngle),
  };
  const a1p2 = {
    x: p1.x + unitX * arrowSize * Math.cos(-arrowAngle) + unitY * arrowSize * Math.sin(-arrowAngle),
    y: p1.y + unitY * arrowSize * Math.cos(-arrowAngle) - unitX * arrowSize * Math.sin(-arrowAngle),
  };

  // Arrow 2 at p2
  const a2p1 = {
    x: p2.x - unitX * arrowSize * Math.cos(arrowAngle) + unitY * arrowSize * Math.sin(arrowAngle),
    y: p2.y - unitY * arrowSize * Math.cos(arrowAngle) - unitX * arrowSize * Math.sin(arrowAngle),
  };
  const a2p2 = {
    x: p2.x - unitX * arrowSize * Math.cos(-arrowAngle) + unitY * arrowSize * Math.sin(-arrowAngle),
    y: p2.y - unitY * arrowSize * Math.cos(-arrowAngle) - unitX * arrowSize * Math.sin(-arrowAngle),
  };

  return (
    <g opacity={opacity} pointerEvents="none">
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
      <path
        d={`M ${p1.x} ${p1.y} L ${a1p1.x} ${a1p1.y} M ${p1.x} ${p1.y} L ${a1p2.x} ${a1p2.y}`}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={`M ${p2.x} ${p2.y} L ${a2p1.x} ${a2p1.y} M ${p2.x} ${p2.y} L ${a2p2.x} ${a2p2.y}`}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function CadConstraintOverlay({
  document,
  documentHeight,
  view,
  selection,
  conflictingConstraintIds = [],
  onPointerDown,
  onDimensionValueChange,
  onDimensionDelete,
}: CadConstraintOverlayProps) {
  const { theme } = useTheme();
  const [editingConstraint, setEditingConstraint] = useState<SketchConstraint | null>(null);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });

  const visiblePointIds = new Set<string>();
  selection.ids.forEach((id) => {
    if (isPointSelectionId(id)) {
      visiblePointIds.add(id);
      return;
    }

    const shape = document.shapes.find((item) => item.id === id);
    if (!shape) return;

    const s = shape as any;
    if (s.p1) visiblePointIds.add(s.p1);
    if (s.p2) visiblePointIds.add(s.p2);
    if (s.center) visiblePointIds.add(s.center);
    if (s.majorAxisPoint) visiblePointIds.add(s.majorAxisPoint);
    if (Array.isArray(s.pointIds)) s.pointIds.forEach((pid: string) => visiblePointIds.add(pid));
    if (Array.isArray(s.controlPointIds)) s.controlPointIds.forEach((pid: string) => visiblePointIds.add(pid));
  });

  const geometricConstraints = document.constraints.filter(
    (constraint) =>
      !isDimensionalConstraint(constraint) &&
      getConstraintPointIds(constraint).some((pointId) => visiblePointIds.has(pointId)),
  );

  const dimensionalConstraints = document.constraints.filter(
    (constraint) =>
      isDimensionalConstraint(constraint) &&
      getConstraintPointIds(constraint).length > 0,
  );

  return (
    <g>
      {geometricConstraints.map((constraint) => {
        const anchor = getConstraintAnchor(constraint, document);
        if (!anchor) return null;

        const screen = cadToScreenPoint(anchor, documentHeight, view);
        const isConflicting = conflictingConstraintIds.includes(constraint.id);

        return (
          <g
            key={constraint.id}
            transform={`translate(${screen.x}, ${screen.y - 24})`}
            onPointerDown={(event) => onPointerDown?.(event, constraint.id)}
            style={{ cursor: "pointer", pointerEvents: "all" }}
          >
            <rect
              x="-8"
              y="-8"
              width="16"
              height="16"
              rx="3"
              fill={isConflicting ? "#fee2e2" : theme.cad.constraintLabelFill}
              stroke={isConflicting ? "#dc2626" : theme.cad.constraintLabelStroke}
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              fontSize="10"
              textAnchor="middle"
              fill={isConflicting ? "#7f1d1d" : theme.cad.constraintLabelText}
              fontWeight="bold"
              pointerEvents="none"
              style={{ userSelect: "none" }}
            >
              {getConstraintSymbol(constraint.type)}
            </text>
          </g>
        );
      })}

      {dimensionalConstraints.map((constraint) => {
        const anchor = getConstraintAnchor(constraint, document);
        if (!anchor) return null;

        const pointIds = getConstraintPointIds(constraint);
        const pts = pointIds
          .map((id) => document.points.find((p) => p.id === id))
          .filter(Boolean) as SketchPoint[];

        const screenAnchor = cadToScreenPoint(anchor, documentHeight, view);
        const displayValue =
          typeof constraint.value === "number"
            ? Number(constraint.value.toFixed(3))
            : "";

        const isBeingEdited = editingConstraint?.id === constraint.id;

        return (
          <g key={constraint.id}>
            {pts.length >= 2 && (
              <DimensionArrows
                p1={cadToScreenPoint(pts[0], documentHeight, view)}
                p2={cadToScreenPoint(pts[1], documentHeight, view)}
                opacity={isBeingEdited ? 1 : 0.3}
                color={theme.cad.selectedStroke}
              />
            )}
            <g transform={`translate(${screenAnchor.x}, ${screenAnchor.y - 18})`}>
              <g
                onPointerDown={(event) => {
                  onPointerDown?.(event, constraint.id);
                  setEditingConstraint(constraint);
                  setDialogPos({ x: event.clientX, y: event.clientY });
                }}
                style={{ cursor: "text", pointerEvents: "all" }}
              >
                <rect
                  x="-24"
                  y="-10"
                  width="48"
                  height="20"
                  rx="5"
                  fill={theme.cad.constraintLabelFill}
                  stroke={theme.cad.constraintLabelStroke}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  fontSize="11"
                  textAnchor="middle"
                  fill={theme.cad.constraintLabelText}
                  fontWeight="bold"
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {constraint.type === "diameter" ? "Ø" : ""}
                  {displayValue}
                </text>
              </g>
            </g>
          </g>
        );
      })}

      <DimensionDialog
        isOpen={!!editingConstraint}
        onClose={() => setEditingConstraint(null)}
        onSubmit={(value) => {
          if (editingConstraint) {
            onDimensionValueChange?.(editingConstraint.id, value);
          }
          setEditingConstraint(null);
        }}
        onDelete={() => {
          if (editingConstraint) {
            onDimensionDelete?.(editingConstraint.id);
          }
          setEditingConstraint(null);
        }}
        initialValue={editingConstraint?.value ?? 0}
        title={`Размер: ${editingConstraint?.type || ""}`}
        x={dialogPos.x}
        y={dialogPos.y}
      />

      {document.points.map((point: SketchPoint) => {
        if (!visiblePointIds.has(point.id)) return null;

        const screen = cadToScreenPoint(point, documentHeight, view);
        const isSelected = selection.refs.some(
          (ref) => ref.kind === "point" && ref.id === point.id,
        );
        const constraintCount = document.constraints.filter((constraint) =>
          getConstraintPointIds(constraint).includes(point.id),
        ).length;
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
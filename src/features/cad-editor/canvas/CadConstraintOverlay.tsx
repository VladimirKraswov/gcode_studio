import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  distanceSignByEdge,
  edgeAxis,
  getConstraintTargetBounds,
  getDistanceBetweenEdges,
  getEdgeMidpoint,
  getSheetBounds,
} from "../model/constraints";
import { shapeBounds } from "../model/shapeBounds";
import type {
  ConstraintEdge,
  SketchDocument,
} from "../model/types";
import type { SelectionState } from "../model/selection";
import type { ViewTransform } from "../model/view";

type ConstraintDraftTarget =
  | {
      kind: "sheet";
      edge: ConstraintEdge;
    }
  | {
      kind: "shape";
      shapeId: string;
      edge: ConstraintEdge;
    };

type ConstraintDraftState = {
  shapeId: string;
  edge: ConstraintEdge;
  pointer: { x: number; y: number };
  hoverTarget: ConstraintDraftTarget | null;
} | null;

type CadConstraintOverlayProps = {
  document: SketchDocument;
  selection: SelectionState;
  documentHeight: number;
  view: ViewTransform;
  constraintDraft: ConstraintDraftState;
  onEdgeHandlePointerDown: (
    event: React.PointerEvent<SVGCircleElement>,
    edge: ConstraintEdge,
  ) => void;
  onConstraintLabelPointerDown: (
    event: React.PointerEvent<SVGRectElement>,
    constraintId: string,
  ) => void;
};

function edgeTitle(edge: ConstraintEdge): string {
  switch (edge) {
    case "left":
      return "L";
    case "right":
      return "R";
    case "top":
      return "T";
    case "bottom":
      return "B";
  }
}

function formatDistance(value: number): string {
  return `${Number(value.toFixed(3)).toString()} мм`;
}

function labelPosition(
  source: { x: number; y: number },
  target: { x: number; y: number },
  edge: ConstraintEdge,
) {
  const mid = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };

  if (edgeAxis(edge) === "x") {
    return { x: mid.x, y: mid.y - 18 };
  }

  return { x: mid.x + 18, y: mid.y };
}

function sourceHandleColor(
  edge: ConstraintEdge,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  switch (edge) {
    case "left":
    case "right":
      return theme.cad.constraintHandleX;
    case "top":
    case "bottom":
      return theme.cad.constraintHandleY;
  }
}

export function CadConstraintOverlay({
  document,
  selection,
  documentHeight,
  view,
  constraintDraft,
  onEdgeHandlePointerDown,
  onConstraintLabelPointerDown,
}: CadConstraintOverlayProps) {
  const { theme } = useTheme();

  const selectedShape =
    document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  const selectedBounds = selectedShape ? shapeBounds(selectedShape) : null;
  const selectedConstraints = selectedShape
    ? document.constraints.filter((item) => item.shapeId === selectedShape.id)
    : [];

  return (
    <g>
      {selectedConstraints.map((constraint) => {
        const sourceShape = document.shapes.find((item) => item.id === constraint.shapeId);
        if (!sourceShape) return null;

        const sourceBounds = shapeBounds(sourceShape);
        const targetBounds = getConstraintTargetBounds(document, constraint);
        if (!targetBounds) return null;

        const sourceMid = getEdgeMidpoint(sourceBounds, constraint.edge);
        const targetMid = getEdgeMidpoint(targetBounds, constraint.targetEdge);

        const sourceScreen = cadToScreenPoint(sourceMid, documentHeight, view);
        const targetScreen = cadToScreenPoint(targetMid, documentHeight, view);
        const label = labelPosition(sourceScreen, targetScreen, constraint.edge);

        const displayDistance =
          constraint.target.kind === "shape" || constraint.target.kind === "sheet"
            ? getDistanceBetweenEdges(
                sourceBounds,
                constraint.edge,
                targetBounds,
                constraint.targetEdge,
              )
            : constraint.distance;

        return (
          <g key={constraint.id}>
            <line
              x1={sourceScreen.x}
              y1={sourceScreen.y}
              x2={targetScreen.x}
              y2={targetScreen.y}
              stroke={constraint.enabled ? theme.cad.constraintStroke : theme.cad.constraintMuted}
              strokeWidth={1.5}
              strokeDasharray={edgeAxis(constraint.edge) === "x" ? "8 5" : "6 4"}
              opacity={0.9}
              pointerEvents="none"
            />

            <circle
              cx={sourceScreen.x}
              cy={sourceScreen.y}
              r={3.5}
              fill={theme.cad.constraintLabelFill}
              stroke={theme.cad.constraintSource}
              strokeWidth={1.5}
              pointerEvents="none"
            />

            <circle
              cx={targetScreen.x}
              cy={targetScreen.y}
              r={3.5}
              fill={theme.cad.constraintLabelFill}
              stroke={theme.cad.constraintTarget}
              strokeWidth={1.5}
              pointerEvents="none"
            />

            <g>
              <rect
                x={label.x - 32}
                y={label.y - 11}
                width={64}
                height={22}
                rx={11}
                fill={theme.cad.constraintLabelFill}
                stroke={theme.cad.constraintLabelStroke}
                strokeWidth={1}
                onPointerDown={(event) => onConstraintLabelPointerDown(event, constraint.id)}
                style={{ cursor: edgeAxis(constraint.edge) === "x" ? "ew-resize" : "ns-resize" }}
              />
              <text
                x={label.x}
                y={label.y + 4}
                fontSize="12"
                fontWeight="700"
                fill={theme.cad.constraintLabelText}
                textAnchor="middle"
                pointerEvents="none"
              >
                {formatDistance(displayDistance)}
              </text>
            </g>
          </g>
        );
      })}

      {selectedBounds &&
        (["left", "right", "top", "bottom"] as ConstraintEdge[]).map((edge) => {
          const point = getEdgeMidpoint(selectedBounds, edge);
          const screen = cadToScreenPoint(point, documentHeight, view);
          const color = sourceHandleColor(edge, theme);

          return (
            <g key={`edge-handle-${edge}`}>
              <circle
                cx={screen.x}
                cy={screen.y}
                r={13}
                fill="transparent"
                onPointerDown={(event) => onEdgeHandlePointerDown(event, edge)}
                style={{ cursor: "crosshair" }}
              />
              <circle
                cx={screen.x}
                cy={screen.y}
                r={6}
                fill={theme.cad.constraintLabelFill}
                stroke={color}
                strokeWidth={2}
                onPointerDown={(event) => onEdgeHandlePointerDown(event, edge)}
                style={{ cursor: "crosshair" }}
              />
              <text
                x={screen.x}
                y={screen.y - 11}
                fontSize="11"
                fontWeight="700"
                fill={color}
                textAnchor="middle"
                pointerEvents="none"
              >
                {edgeTitle(edge)}
              </text>
            </g>
          );
        })}

      {constraintDraft && selectedShape && (() => {
        const shape = document.shapes.find((item) => item.id === constraintDraft.shapeId);
        if (!shape) return null;

        const sourceBounds = shapeBounds(shape);
        const sourceMid = getEdgeMidpoint(sourceBounds, constraintDraft.edge);
        const sourceScreen = cadToScreenPoint(sourceMid, documentHeight, view);

        let targetCad = constraintDraft.pointer;

        if (constraintDraft.hoverTarget) {
          if (constraintDraft.hoverTarget.kind === "sheet") {
            targetCad = getEdgeMidpoint(
              getSheetBounds(document),
              constraintDraft.hoverTarget.edge,
            );
          } else {
            const targetShape = document.shapes.find(
              (item) =>
                item.id ===
                (constraintDraft.hoverTarget as Extract<
                  ConstraintDraftTarget,
                  { kind: "shape" }
                >).shapeId,
            );
            if (targetShape) {
              targetCad = getEdgeMidpoint(
                shapeBounds(targetShape),
                constraintDraft.hoverTarget.edge,
              );
            }
          }
        }

        const targetScreen = cadToScreenPoint(targetCad, documentHeight, view);
        const label = labelPosition(sourceScreen, targetScreen, constraintDraft.edge);

        let previewDistance = 0;

        if (constraintDraft.hoverTarget) {
          const targetBounds =
            constraintDraft.hoverTarget.kind === "sheet"
              ? getSheetBounds(document)
              : shapeBounds(
                  document.shapes.find(
                    (item) =>
                      item.id ===
                      (constraintDraft.hoverTarget as Extract<
                        ConstraintDraftTarget,
                        { kind: "shape" }
                      >).shapeId,
                  )!,
                );

          previewDistance = getDistanceBetweenEdges(
            sourceBounds,
            constraintDraft.edge,
            targetBounds,
            constraintDraft.hoverTarget.edge,
          );
        } else {
          const axis = edgeAxis(constraintDraft.edge);
          const sourceValue =
            axis === "x" ? sourceMid.x : sourceMid.y;
          const pointerValue =
            axis === "x" ? constraintDraft.pointer.x : constraintDraft.pointer.y;
          previewDistance = Number(
            (
              (pointerValue - sourceValue) *
              distanceSignByEdge(constraintDraft.edge)
            ).toFixed(3),
          );
        }

        return (
          <g>
            <line
              x1={sourceScreen.x}
              y1={sourceScreen.y}
              x2={targetScreen.x}
              y2={targetScreen.y}
              stroke={theme.cad.constraintPreviewStroke}
              strokeWidth={2}
              strokeDasharray="8 5"
              pointerEvents="none"
            />

            <circle
              cx={sourceScreen.x}
              cy={sourceScreen.y}
              r={4}
              fill={theme.cad.constraintLabelFill}
              stroke={theme.cad.constraintPreviewStroke}
              strokeWidth={2}
              pointerEvents="none"
            />

            <circle
              cx={targetScreen.x}
              cy={targetScreen.y}
              r={4}
              fill={theme.cad.constraintLabelFill}
              stroke={theme.cad.constraintPreviewStroke}
              strokeWidth={2}
              pointerEvents="none"
            />

            <rect
              x={label.x - 34}
              y={label.y - 11}
              width={68}
              height={22}
              rx={11}
              fill={theme.cad.constraintPreviewFill}
              stroke={theme.cad.constraintPreviewBorder}
              strokeWidth={1}
              pointerEvents="none"
            />
            <text
              x={label.x}
              y={label.y + 4}
              fontSize="12"
              fontWeight="700"
              fill={theme.cad.constraintPreviewText}
              textAnchor="middle"
              pointerEvents="none"
            >
              {formatDistance(previewDistance)}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
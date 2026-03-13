import React from "react";
import type { CadPoint } from "@/utils/fontGeometry";
import type { ViewTransform } from "../model/view";
import type { SketchShape, SketchPoint } from "../model/types";
import { useTranslation } from "react-i18next";
import { cadToScreenPoint } from "@/utils/coordinates";
import type { SketchSolveState } from "../model/solver/diagnostics";
import { useShapePlugin } from "../plugins/registry";

type ShapeRendererProps = {
  shape: SketchShape;
  points: SketchPoint[];
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  selectionMode: "primitive" | "object";
  textPreviewMap: Record<string, CadPoint[][]>;
  solveState?: SketchSolveState;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
  overrideStroke?: string;
};

export function ShapeRenderer({
  shape,
  points,
  documentHeight,
  view,
  isSelected,
  selectionMode,
  textPreviewMap,
  solveState,
  onPointerDown,
  overrideStroke,
}: ShapeRendererProps) {
  const { t } = useTranslation();
  const plugin = useShapePlugin(shape);

  if (!plugin) {
    console.warn(`No shape plugin registered for type "${shape.type}"`);
    return null;
  }

  const rendered = plugin.render({
    shape,
    points,
    documentHeight,
    view,
    isSelected,
    selectionMode,
    textPreviewMap,
    solveState,
    onPointerDown,
  });

  const camOp = shape.camSettings?.operation;
  const isPocket = camOp === "pocket";
  const isInside = camOp === "profile-inside";
  const isOutside = camOp === "profile-outside";

  const svgPath = plugin.getSvgPath?.(shape, points);
  const feedbackAnchor = plugin.getFeedbackAnchor?.(shape, points);

  let feedback = null;

  if (selectionMode === "object" && svgPath && (isPocket || isInside || isOutside)) {
    const screenPath = svgPath
      .replace(/([ML])\s*(-?[\d.]+)\s*(-?[\d.]+)/g, (_, cmd, x, y) => {
        const p = cadToScreenPoint(
          { x: parseFloat(x), y: parseFloat(y) },
          documentHeight,
          view,
        );
        return `${cmd} ${p.x} ${p.y}`;
      })
      .replace(/([h])\s*(-?[\d.]+)/g, (_, cmd, x) => {
        return `${cmd} ${parseFloat(x) * view.scale}`;
      })
      .replace(/([v])\s*(-?[\d.]+)/g, (_, cmd, y) => {
        return `${cmd} ${parseFloat(y) * view.scale}`;
      })
      .replace(/([a])\s*(-?[\d.]+)\s*(-?[\d.]+)\s*(\d+)\s*(\d+)\s*(\d+)\s*(-?[\d.]+)\s*(-?[\d.]+)/g, (_, cmd, rx, ry, rot, large, sweep, x, y) => {
        const p = cadToScreenPoint({ x: parseFloat(x), y: parseFloat(y) }, documentHeight, view);
        return `${cmd} ${parseFloat(rx) * view.scale} ${parseFloat(ry) * view.scale} ${rot} ${large} ${sweep} ${p.x} ${p.y}`;
      });

    const strokeColor = isOutside ? "#22c55e" : isInside ? "#3b82f6" : undefined;
    const strokeWidth = (isOutside || isInside) ? Math.max(2, (shape.strokeWidth ?? 1) * view.scale + 1) : undefined;

    feedback = (
      <g pointerEvents="none">
        {isPocket && (
          <path
            d={screenPath}
            fill="url(#pocket-hatch)"
            className="text-primary/30"
          />
        )}
        {(isOutside || isInside) && (
          <path
            d={screenPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={0.6}
          />
        )}
        {feedbackAnchor && (isOutside || isInside) && (
          <g>
            {(() => {
              const anchor = cadToScreenPoint(feedbackAnchor, documentHeight, view);
              const dir = isOutside ? 1 : -1;
              const dist = 12;
              const cx = anchor.x + feedbackAnchor.nx * dist * dir;
              const cy = anchor.y - feedbackAnchor.ny * dist * dir;
              const label = isOutside ? t("cad.properties.cam_out") : t("cad.properties.cam_in");

              return (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={strokeColor}
                    opacity={0.8}
                  />
                  <text
                    x={cx + (feedbackAnchor.nx || 1) * 8}
                    y={cy - (feedbackAnchor.ny || 0) * 8}
                    fontSize={10}
                    fill={strokeColor}
                    fontWeight="bold"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {label}
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </g>
    );
  }

  if (overrideStroke && React.isValidElement(rendered)) {
    return (
      <g>
        {React.cloneElement(rendered as React.ReactElement<any>, {
          stroke: overrideStroke,
        })}
        {feedback}
      </g>
    );
  }

  return (
    <g>
      {rendered}
      {feedback}
    </g>
  );
}
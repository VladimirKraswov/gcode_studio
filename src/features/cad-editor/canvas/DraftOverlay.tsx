import { cadToScreenPoint } from "@/utils/coordinates";
import { useTheme } from "@/shared/hooks/useTheme";
import type { ViewTransform } from "../model/view";
import type { SketchPolylinePoint } from "../model/types";
import type { DraftShape } from "../geometry/draftGeometry";
import {
  getArcPreviewPoints,
  getCircleFromDraft,
  getLineFromDraft,
  getPolylinePreviewPoints,
  getRectangleFromDraft,
} from "../geometry/draftGeometry";

type DraftOverlayProps = {
  draft: DraftShape;
  polylineDraft: SketchPolylinePoint[];
  polylineHoverPoint: SketchPolylinePoint | null;
  documentHeight: number;
  view: ViewTransform;
};

export function DraftOverlay({
  draft,
  polylineDraft,
  polylineHoverPoint,
  documentHeight,
  view,
}: DraftOverlayProps) {
  const { theme } = useTheme();

  const polylinePreview = getPolylinePreviewPoints(
    polylineDraft,
    polylineHoverPoint,
  );

  return (
    <>
      {polylinePreview.length > 0 && (
        <>
          {polylinePreview.length > 1 && (
            <polyline
              points={polylinePreview
                .map((point) => {
                  const p = cadToScreenPoint(point, documentHeight, view);
                  return `${p.x},${p.y}`;
                })
                .join(" ")}
              fill="none"
              stroke={theme.cad.draftAccent}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {polylineDraft.map((point, index) => {
            const p = cadToScreenPoint(point, documentHeight, view);
            return (
              <circle
                key={`poly-draft-${index}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={theme.cad.constraintLabelFill}
                stroke={theme.cad.draftAccent}
                strokeWidth={1.5}
              />
            );
          })}

          {polylineHoverPoint && polylineDraft.length > 0 && (() => {
            const p = cadToScreenPoint(polylineHoverPoint, documentHeight, view);
            return (
              <circle
                cx={p.x}
                cy={p.y}
                r={3}
                fill={theme.cad.draftAccent}
                opacity={0.85}
              />
            );
          })()}
        </>
      )}

      {draft?.type === "rectangle" && (() => {
        const rect = getRectangleFromDraft(draft);
        const p = cadToScreenPoint(
          { x: rect.x, y: rect.y + rect.height },
          documentHeight,
          view,
        );

        return (
          <rect
            x={p.x}
            y={p.y}
            width={rect.width * view.scale}
            height={rect.height * view.scale}
            fill={theme.cad.draftFill}
            stroke={theme.cad.draftStroke}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            rx={8}
          />
        );
      })()}

      {draft?.type === "circle" && (() => {
        const circle = getCircleFromDraft(draft);
        const p = cadToScreenPoint(
          { x: circle.cx, y: circle.cy },
          documentHeight,
          view,
        );

        return (
          <circle
            cx={p.x}
            cy={p.y}
            r={circle.radius * view.scale}
            fill={theme.cad.draftFill}
            stroke={theme.cad.draftStroke}
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
        );
      })()}

      {draft?.type === "line" && (() => {
        const line = getLineFromDraft(draft);
        const p1 = cadToScreenPoint(
          { x: line.x1, y: line.y1 },
          documentHeight,
          view,
        );
        const p2 = cadToScreenPoint(
          { x: line.x2, y: line.y2 },
          documentHeight,
          view,
        );

        return (
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={theme.cad.draftStroke}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      })()}

      {draft?.type === "arc" && draft.stage === "radius" && (() => {
        const center = cadToScreenPoint(
          { x: draft.centerX, y: draft.centerY },
          documentHeight,
          view,
        );
        const end = cadToScreenPoint(
          { x: draft.endX, y: draft.endY },
          documentHeight,
          view,
        );

        return (
          <>
            <circle
              cx={center.x}
              cy={center.y}
              r={4}
              fill={theme.cad.draftStroke}
            />
            <line
              x1={center.x}
              y1={center.y}
              x2={end.x}
              y2={end.y}
              stroke={theme.cad.draftStroke}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </>
        );
      })()}

      {draft?.type === "arc" && draft.stage === "sweep" && (() => {
        const preview = getArcPreviewPoints(draft);
        const points = preview
          .map((point) => {
            const p = cadToScreenPoint(point, documentHeight, view);
            return `${p.x},${p.y}`;
          })
          .join(" ");

        const center = cadToScreenPoint(
          { x: draft.centerX, y: draft.centerY },
          documentHeight,
          view,
        );
        const start = cadToScreenPoint(
          { x: draft.startX, y: draft.startY },
          documentHeight,
          view,
        );
        const end = cadToScreenPoint(
          { x: draft.endX, y: draft.endY },
          documentHeight,
          view,
        );

        return (
          <>
            <circle cx={center.x} cy={center.y} r={4} fill={theme.cad.draftStroke} />

            <line
              x1={center.x}
              y1={center.y}
              x2={start.x}
              y2={start.y}
              stroke={theme.cad.draftGuide}
              strokeDasharray="4 4"
              strokeWidth={1.25}
              strokeLinecap="round"
            />

            <line
              x1={center.x}
              y1={center.y}
              x2={end.x}
              y2={end.y}
              stroke={theme.cad.draftGuide}
              strokeDasharray="4 4"
              strokeWidth={1.25}
              strokeLinecap="round"
            />

            <polyline
              points={points}
              fill="none"
              stroke={theme.cad.draftStroke}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      })()}
    </>
  );
}
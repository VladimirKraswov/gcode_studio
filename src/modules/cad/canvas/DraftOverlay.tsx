import { cadToScreenPoint } from "../../../utils/coordinates";
import type { ViewTransform } from "../model/view";
import type { SketchPolylinePoint } from "../model/types";
import type { DraftShape } from "../geometry/draftGeometry";
import { getRectangleFromDraft, getCircleFromDraft } from "../geometry/draftGeometry";

type DraftOverlayProps = {
  draft: DraftShape;
  polylineDraft: SketchPolylinePoint[];
  documentHeight: number;
  view: ViewTransform;
};

export function DraftOverlay({ draft, polylineDraft, documentHeight, view }: DraftOverlayProps) {
  return (
    <>
      {polylineDraft.length > 1 && (
        <polyline
          points={polylineDraft
            .map((point) => {
              const p = cadToScreenPoint(point, documentHeight, view);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {draft?.type === "rectangle" && (() => {
        const rect = getRectangleFromDraft(draft);
        const p = cadToScreenPoint({ x: rect.x, y: rect.y + rect.height }, documentHeight, view);
        return (
          <rect
            x={p.x}
            y={p.y}
            width={rect.width * view.scale}
            height={rect.height * view.scale}
            fill="rgba(37,99,235,0.12)"
            stroke="#2563eb"
            strokeDasharray="6 4"
            rx={8}
          />
        );
      })()}

      {draft?.type === "rectangle" && (() => {
        const rect = getRectangleFromDraft(draft);
        const p = cadToScreenPoint({ x: rect.x, y: rect.y + rect.height }, documentHeight, view);
        return (
          <rect
            x={p.x}
            y={p.y}
            width={rect.width * view.scale}
            height={rect.height * view.scale}
            fill="rgba(37,99,235,0.12)"
            stroke="#2563eb"
            strokeDasharray="6 4"
          />
        );
      })()}
    </>
  );
}


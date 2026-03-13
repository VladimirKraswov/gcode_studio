import React from "react";
import { cadToScreenPoint } from "@/utils/coordinates";
import type { ViewTransform } from "../model/view";

type SelectionBoxOverlayProps = {
  box: { startX: number; startY: number; endX: number; endY: number; moved: boolean } | null;
  documentHeight: number;
  view: ViewTransform;
};

export const SelectionBoxOverlay: React.FC<SelectionBoxOverlayProps> = ({ box, documentHeight, view }) => {
  if (!box || !box.moved) return null;

  const minX = Math.min(box.startX, box.endX);
  const maxY = Math.max(box.startY, box.endY);
  const width = Math.abs(box.startX - box.endX);
  const height = Math.abs(box.startY - box.endY);

  const screenPos = cadToScreenPoint({ x: minX, y: maxY }, documentHeight, view);

  return (
    <rect
      x={screenPos.x}
      y={screenPos.y}
      width={width * view.scale}
      height={height * view.scale}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgba(59, 130, 246, 0.5)"
      strokeWidth={1}
      strokeDasharray="4 2"
      pointerEvents="none"
    />
  );
};

import React from "react";

type SelectionBoxOverlayProps = {
  box: { startX: number; startY: number; endX: number; endY: number; moved: boolean } | null;
};

export const SelectionBoxOverlay: React.FC<SelectionBoxOverlayProps> = ({ box }) => {
  if (!box || !box.moved) return null;

  const minX = Math.min(box.startX, box.endX);
  const minY = Math.min(box.startY, box.endY);
  const width = Math.abs(box.startX - box.endX);
  const height = Math.abs(box.startY - box.endY);

  return (
    <rect
      x={minX}
      y={minY}
      width={width}
      height={height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgba(59, 130, 246, 0.5)"
      strokeWidth={1}
      strokeDasharray="4 2"
      pointerEvents="none"
    />
  );
};

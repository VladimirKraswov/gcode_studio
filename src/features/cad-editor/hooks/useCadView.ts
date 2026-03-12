import { useState, useCallback } from "react";
import type { ViewTransform } from "../model/view";
import type { PanState } from "./types";
import { clamp } from "@/shared/utils/common";

interface UseCadViewParams {
  view: ViewTransform;
  onViewChange: React.Dispatch<React.SetStateAction<ViewTransform>>;
  onViewChangeSilently: React.Dispatch<React.SetStateAction<ViewTransform>>;
  checkpointHistory: () => void;
  panButtonMode: "middle" | "right" | "both";
}

export function useCadView({
  view,
  onViewChange,
  onViewChangeSilently,
  checkpointHistory,
  panButtonMode,
}: UseCadViewParams) {
  const [panState, setPanState] = useState<PanState | null>(null);

  const isPanMouseButton = useCallback((button: number): boolean => {
    if (panButtonMode === "middle") return button === 1;
    if (panButtonMode === "right") return button === 2;
    return button === 1 || button === 2;
  }, [panButtonMode]);

  const startPan = useCallback((
    event: React.PointerEvent<SVGElement | SVGSVGElement>,
    options?: { clearSelectionOnPointerUp?: boolean },
  ) => {
    event.preventDefault();
    checkpointHistory();

    setPanState({
      pointerId: event.pointerId,
      button: event.button,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: view.offsetX,
      startOffsetY: view.offsetY,
      clearSelectionOnPointerUp: options?.clearSelectionOnPointerUp ?? false,
      moved: false,
    });
  }, [view.offsetX, view.offsetY, checkpointHistory]);

  const handleCanvasWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const direction = event.deltaY < 0 ? 1 : -1;

    onViewChange((prev) => {
      const nextScale = clamp(prev.scale * (1 + direction * 0.06), 0.25, 20);
      const ratio = nextScale / prev.scale;

      return {
        scale: nextScale,
        offsetX: anchorX - (anchorX - prev.offsetX) * ratio,
        offsetY: anchorY - (anchorY - prev.offsetY) * ratio,
      };
    });
  }, [onViewChange]);

  const resetView = useCallback(() => {
    onViewChange({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [onViewChange]);

  return {
    panState,
    setPanState,
    isPanMouseButton,
    startPan,
    handleCanvasWheel,
    resetView,
    onViewChangeSilently,
  };
}

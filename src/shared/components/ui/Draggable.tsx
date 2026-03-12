import { useState, useCallback, useRef, useEffect } from "react";

interface DraggableProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  className?: string;
  handleClassName?: string;
}

export function Draggable({
  children,
  initialX = 0,
  initialY = 0,
  className = "",
  handleClassName = "",
}: DraggableProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: initialX, y: initialY });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag if clicking on the handle or if no handle is specified
    if (handleClassName && !(e.target as HTMLElement).closest(`.${handleClassName}`)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...pos };
  }, [pos, handleClassName]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setPos({
      x: posStart.current.x + dx,
      y: posStart.current.y + dy,
    });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  return (
    <div
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        position: "relative",
        zIndex: isDragging ? 1000 : 100,
      }}
      className={className}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  );
}

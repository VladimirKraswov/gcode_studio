// src/layouts/MainLayout.tsx
import { useState, useCallback, useEffect, type ReactNode } from "react";

type MainLayoutProps = {
  header: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  bottomBar?: ReactNode;
};

export function MainLayout({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  bottomBar,
}: MainLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);

  const [rightWidth, setRightWidth] = useState(300);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const nextWidth = Math.max(200, Math.min(600, e.clientX));
      setLeftWidth(nextWidth);
    } else if (isResizingRight) {
      const nextWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
      setRightWidth(nextWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizingLeft, isResizingRight, resize, stopResizing]);

  const isResizing = isResizingLeft || isResizingRight;

  return (
    <div className={`ui-app-shell flex flex-col h-screen overflow-hidden bg-bg text-text ${isResizing ? "cursor-col-resize select-none" : ""}`}>
      {/* Top Header / Mode Switcher */}
      <div className="z-[100] shrink-0 relative">
        {header}
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Explorer) */}
        {leftPanel && (
          <aside
              className="shrink-0 border-r border-border bg-panel-solid flex flex-col overflow-hidden relative"
              style={{ width: leftWidth }}
          >
            {leftPanel}
            <div
              className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-50 border-r border-transparent hover:border-primary/20"
              onMouseDown={startResizingLeft}
            />
          </aside>
        )}

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-soft relative overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 min-w-full relative">
            {centerPanel}
          </div>

          {/* Bottom Bar (Status/Timeline) */}
          {bottomBar && (
            <div className="h-9 shrink-0 border-t border-border bg-panel-solid z-40">
              {bottomBar}
            </div>
          )}
        </main>

        {/* Right Sidebar (Properties) */}
        {rightPanel && (
          <aside
              className="shrink-0 border-l border-border bg-panel-solid flex flex-col overflow-hidden relative"
              style={{ width: rightWidth }}
          >
            <div
              className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-50 border-l border-transparent hover:border-primary/20"
              onMouseDown={startResizingRight}
            />
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}

// src/layouts/MainLayout.tsx
import type { ReactNode } from "react";

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
  return (
    <div className="ui-app-shell flex flex-col h-screen overflow-hidden bg-bg text-text">
      {/* Top Header / Mode Switcher */}
      <div className="z-50 shrink-0">
        {header}
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Explorer) */}
        <aside className="w-[280px] shrink-0 border-r border-border bg-panel-solid flex flex-col overflow-hidden">
          {leftPanel}
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-soft relative overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden relative">
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
        <aside className="w-[300px] shrink-0 border-l border-border bg-panel-solid flex flex-col overflow-hidden">
          {rightPanel}
        </aside>
      </div>
    </div>
  );
}

// src/layouts/MainLayout.tsx
import type { ReactNode } from "react";

type MainLayoutProps = {
  header: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
};

export function MainLayout({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
}: MainLayoutProps) {
  return (
    <div className="ui-app-shell">
      <div className="ui-page">
        <div className="ui-page-grid">
          <div className="ui-column">{leftPanel}</div>
          <div className="ui-column">
            {header}
            {centerPanel}
          </div>
          <div className="ui-column">{rightPanel}</div>
        </div>
      </div>
    </div>
  );
}
// src/layouts/MainLayout.tsx
// src/layouts/MainLayout.tsx
import type { ReactNode } from "react";
import { ui } from "../styles/ui";

type MainLayoutProps = {
  header: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
};

export function MainLayout({ header, leftPanel, centerPanel, rightPanel }: MainLayoutProps) {
  return (
    <div style={ui.appShell}>
      <div style={ui.page}>
        <div style={ui.pageGrid}>
          {/* Левая колонка */}
          <div style={ui.column}>
            {leftPanel}
          </div>

          {/* Центральная колонка */}
          <div style={ui.column}>
            {header}
            {centerPanel}
          </div>

          {/* Правая колонка */}
          <div style={ui.column}>
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
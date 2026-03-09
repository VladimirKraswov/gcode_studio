// src/layouts/MainLayout.tsx
import type { ReactNode } from "react";
import { useStyles } from "../styles/useStyles";

type MainLayoutProps = {
  header: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
};

export function MainLayout({ header, leftPanel, centerPanel, rightPanel }: MainLayoutProps) {
  const styles = useStyles();

  return (
    <div style={styles.appShell}>
      <div style={styles.page}>
        <div style={styles.pageGrid}>
          {/* Левая колонка */}
          <div style={styles.column}>
            {leftPanel}
          </div>

          {/* Центральная колонка */}
          <div style={styles.column}>
            {header}
            {centerPanel}
          </div>

          {/* Правая колонка */}
          <div style={styles.column}>
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
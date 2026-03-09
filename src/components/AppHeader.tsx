// src/components/AppHeader.tsx
import { MainTabs } from "./MainTabs";
import { ThemeToggle } from "./ThemeToggle";
import type { MainTab } from "../types/ui";
import { useStyles } from "../styles/useStyles";
import { useTheme } from "../contexts/ThemeContext";

type AppHeaderProps = {
  fileName: string;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  tabMeta: { title: string; subtitle: string; icon: React.ReactNode };
};

export function AppHeader({
  fileName,
  activeTab,
  onTabChange,
  tabMeta,
}: AppHeaderProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div
      style={{
        ...styles.panel,
        padding: "8px 12px",
        background: theme.panelSolid,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* Левая часть – иконка вкладки, название, имя файла */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            ...styles.iconBadge,
            width: 32,
            height: 32,
            borderRadius: 10,
          }}
        >
          {tabMeta.icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
          {tabMeta.title}
        </span>
        <span
          style={{
            fontSize: 12,
            color: theme.textMuted,
            marginLeft: 4,
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fileName}
        </span>
      </div>

      {/* Правая часть – переключатель темы и вкладки */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        <MainTabs activeTab={activeTab} onChange={onTabChange} />
      </div>
    </div>
  );
}
import { MainTabs } from "./MainTabs";
import type { MainTab } from "../types/ui";
import { theme, ui } from "../styles/ui";

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

    return (
      <div
        style={{
          ...ui.panel,
          padding: "8px 12px",
          background: theme.panelSolid,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              ...ui.iconBadge,
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
        <MainTabs activeTab={activeTab} onChange={onTabChange} />
      </div>
    );
  }

// src/modules/cad/panels/settings/SettingsTabs.tsx
import { useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type SettingsTabsProps = {
  tabs: Tab[];
};

export function SettingsTabs({ tabs }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const { theme } = useTheme();

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: 8,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: activeTab === tab.id ? theme.primarySoft : "transparent",
              color: activeTab === tab.id ? theme.primaryText : theme.textSoft,
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === activeTab)?.content}</div>
    </div>
  );
}
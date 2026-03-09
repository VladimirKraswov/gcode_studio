import { FiCode, FiEdit3, FiEye } from "react-icons/fi";
import type { MainTab } from "../types/ui";
import { useStyles } from "../styles/useStyles";
import { useTheme } from "../contexts/ThemeContext";

type MainTabsProps = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

const tabs: Array<{ id: MainTab; label: string; icon: React.ReactNode }> = [
  { id: "view", label: "3D-превью", icon: <FiEye size={16} /> },
  { id: "gcode", label: "G-code", icon: <FiCode size={16} /> },
  { id: "edit", label: "Редактор", icon: <FiEdit3 size={16} /> },
];

export function MainTabs({ activeTab, onChange }: MainTabsProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              height: 42,
              padding: "0 16px",
              borderRadius: 999,
              border: isActive
                ? `1px solid ${theme.primaryText}`
                : `1px solid ${theme.border}`,
              background: isActive
                ? `linear-gradient(180deg, ${theme.primary} 0%, ${theme.primaryText} 100%)`
                : theme.panelSolid,
              color: isActive ? "#fff" : theme.textSoft,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: isActive
                ? `0 10px 20px ${theme.primary}30`
                : "none",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
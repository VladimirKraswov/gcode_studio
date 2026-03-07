import { FiCode, FiEdit3, FiEye } from "react-icons/fi";
import type { MainTab } from "../types/ui";
import { theme } from "../styles/ui";

type MainTabsProps = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

const tabs: Array<{ id: MainTab; label: string; icon: React.ReactNode }> = [
  { id: "view", label: "3D Preview", icon: <FiEye size={16} /> },
  { id: "gcode", label: "G-code", icon: <FiCode size={16} /> },
  { id: "edit", label: "Editor", icon: <FiEdit3 size={16} /> },
];

export function MainTabs({ activeTab, onChange }: MainTabsProps) {
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
                ? "1px solid #1d4ed8"
                : `1px solid ${theme.border}`,
              background: isActive
                ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)"
                : "#fff",
              color: isActive ? "#fff" : theme.textSoft,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: isActive
                ? "0 10px 20px rgba(37, 99, 235, 0.18)"
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
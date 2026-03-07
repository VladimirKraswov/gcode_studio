import type { MainTab } from "../types/ui";

type MainTabsProps = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

const tabs: Array<{ id: MainTab; label: string }> = [
  { id: "view", label: "View" },
  { id: "gcode", label: "G-code Editor" },
  { id: "edit", label: "Edit" },
];

export function MainTabs({ activeTab, onChange }: MainTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 12,
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: 12,
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
              padding: "8px 12px",
              borderRadius: 10,
              border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1",
              background: isActive ? "#dbeafe" : "white",
              color: isActive ? "#1d4ed8" : "#0f172a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
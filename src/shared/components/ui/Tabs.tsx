import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`flex rounded-xl border p-1 ${className}`}
      style={{
        background: "var(--color-panel-muted)",
        borderColor: "var(--color-border)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-[13px] font-bold transition-all"
            style={
              isActive
                ? {
                    background: "var(--color-panel-solid)",
                    color: "var(--color-primary)",
                    borderColor: "var(--color-border)",
                    boxShadow: "var(--shadow-soft)",
                  }
                : {
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    borderColor: "transparent",
                  }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
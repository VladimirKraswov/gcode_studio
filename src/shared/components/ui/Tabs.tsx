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
  variant?: "primary" | "pill";
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = "", variant = "primary" }) => {
  if (variant === "pill") {
    return (
      <div className={`flex p-1 bg-panel-muted/50 rounded-lg border border-border/50 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 h-7 rounded-md px-3 text-[11px] font-bold transition-all ${
              activeTab === tab.id
                ? "bg-panel-solid text-primary shadow-sm ring-1 ring-border/20"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex border-b border-border w-full bg-panel-muted/20 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center justify-center gap-2 px-4 h-9 min-w-[80px] text-[12px] font-bold transition-all border-r border-border/50 last:border-r-0 ${
            activeTab === tab.id
              ? "bg-panel-solid text-primary"
              : "text-text-muted hover:text-text hover:bg-panel-muted/40"
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

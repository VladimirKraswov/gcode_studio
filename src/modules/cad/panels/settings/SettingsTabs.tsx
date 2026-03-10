// src/modules/cad/panels/settings/SettingsTabs.tsx
import { useState } from "react";

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

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)] pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "cursor-pointer rounded-lg px-3 py-1.5 text-[13px]",
                isActive
                  ? "bg-[var(--color-primary-soft)] font-bold text-[var(--color-primary-text)]"
                  : "bg-transparent font-medium text-[var(--color-text-soft)]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>{tabs.find((t) => t.id === activeTab)?.content}</div>
    </div>
  );
}
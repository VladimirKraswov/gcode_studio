import { FiCode, FiEdit3, FiEye } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { MainTab } from "@/types/ui";

type MainTabsProps = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

export function MainTabs({ activeTab, onChange }: MainTabsProps) {
  const { t } = useTranslation();

  const tabs: Array<{ id: MainTab; label: string; icon: React.ReactNode }> = [
    { id: "view", label: t("tabs.preview"), icon: <FiEye size={16} /> },
    { id: "gcode", label: t("tabs.gcode"), icon: <FiCode size={16} /> },
    { id: "edit", label: t("tabs.edit"), icon: <FiEdit3 size={16} /> },
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "inline-flex h-[42px] items-center gap-2 rounded-full px-4 text-[13px] font-extrabold transition",
              isActive
                ? "border text-white shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]"
                : "border bg-[var(--color-panel-solid)] text-[var(--color-text-soft)]",
            ].join(" ")}
            style={
              isActive
                ? {
                    borderColor: "var(--color-primary-text)",
                    background:
                      "linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-text) 100%)",
                  }
                : {
                    borderColor: "var(--color-border)",
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
}
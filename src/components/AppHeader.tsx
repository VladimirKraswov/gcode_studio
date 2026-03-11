// src/components/AppHeader.tsx
import { MainTabs } from "./MainTabs";
import { ThemeToggle } from "./ThemeToggle";
import type { MainTab } from "@/types/ui";

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
    <div className="ui-panel flex shrink-0 items-center justify-between gap-3 bg-[var(--color-panel-solid)] px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
          {tabMeta.icon}
        </div>

        <span className="text-sm font-semibold text-[var(--color-text)]">
          {tabMeta.title}
        </span>

        <span className="ml-1 max-w-40 truncate whitespace-nowrap text-xs text-[var(--color-text-muted)]">
          {fileName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <MainTabs activeTab={activeTab} onChange={onTabChange} />
      </div>
    </div>
  );
}
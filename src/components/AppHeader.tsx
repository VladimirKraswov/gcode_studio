// src/components/AppHeader.tsx
import { ThemeToggle } from "./ThemeToggle";
import type { MainTab } from "@/types/ui";
import { FiCode, FiEye, FiTool, FiFolder, FiSave, FiDownload } from "react-icons/fi";
import { IconButton } from "@/shared/components/ui/IconButton";
import { Separator } from "@/shared/components/ui/Separator";

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
}: AppHeaderProps) {
  const tabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: "edit", label: "Конструктор", icon: <FiTool size={14} /> },
    { id: "view", label: "Превью", icon: <FiEye size={14} /> },
    { id: "gcode", label: "G-code", icon: <FiCode size={14} /> },
  ];

  return (
    <div className="h-12 flex items-center justify-between px-3 bg-panel-solid border-b border-border shadow-sm">
      <div className="flex items-center gap-3 min-w-0">

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <img
            src="/logo.svg"
            alt="GCode Studio"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-sm tracking-tight hidden sm:inline">
            GCode Studio
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 ml-2 overflow-hidden">
          <IconButton icon={<FiFolder size={16} />} title="Открыть проект" />
          <IconButton icon={<FiSave size={16} />} title="Сохранить проект" />
          <IconButton icon={<FiDownload size={16} />} title="Экспорт G-code" />
          <span className="text-[12px] font-medium text-text-muted truncate ml-2">
            {fileName || "Untitled project"}
          </span>
        </div>
      </div>

      {/* Center Workflow Switcher */}
      <div className="flex p-1 bg-panel-muted rounded-lg border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 h-8 rounded text-[13px] font-bold transition-all ${
              activeTab === tab.id
                ? "bg-panel-solid text-primary shadow-sm border border-border"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
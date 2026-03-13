import { FiDownload, FiFolder, FiMenu, FiMoon, FiSettings, FiSun, FiEye, FiCode, FiTool, FiTerminal } from "react-icons/fi";
import { useTheme } from "@/shared/hooks/useTheme";
import { useUI } from "@/contexts/UIContext";
import { type MainTab } from "@/types/ui";

type AppHeaderProps = {
  fileName: string;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  tabMeta: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  };
};

export function AppHeader({ fileName, activeTab, onTabChange }: AppHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const ui = useUI();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel-solid px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
          <FiMenu size={20} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text leading-tight flex items-center gap-2">
            GCode Studio
            <span className="px-1.5 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] uppercase tracking-wider">Alpha</span>
          </h1>
          <p className="text-[11px] text-text-muted font-medium flex items-center gap-1.5">
            <FiFolder size={10} />
            {fileName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-panel-muted p-1 rounded-xl border border-border">
        {(["view", "gcode", "edit", "console"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${activeTab === tab
                ? "bg-panel-solid text-primary shadow-sm border border-border"
                : "text-text-muted hover:text-text hover:bg-panel-solid/50"}
            `}
          >
            {tab === "view" && <FiEye size={14} />}
            {tab === "gcode" && <FiCode size={14} />}
            {tab === "edit" && <FiTool size={14} />}
            {tab === "console" && <FiTerminal size={14} />}
            {tab === "view" ? "Превью" : tab === "gcode" ? "G-code" : tab === "edit" ? "Конструктор" : "Консоль"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
           <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-panel-muted transition-colors"
          >
            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button
            onClick={() => ui.setIsSettingsOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-panel-muted transition-colors"
          >
            <FiSettings size={18} />
          </button>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <FiDownload size={14} />
          Экспорт
        </button>
      </div>
    </header>
  );
}

import { FiCode, FiEye, FiLoader, FiTool, FiTerminal } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { AppProvider } from "@/contexts/AppContext";
import { useGCode } from "@/contexts/GCodeContext";
import { useUI } from "@/contexts/UIContext";
import { useSettings } from "@/contexts/SettingsContext";
import { MainLayout } from "@/layouts/MainLayout";
import { AppHeader } from "@/components/AppHeader";
import { LeftPanelContainer } from "@/containers/LeftPanelContainer";
import { CenterPanelContainer } from "@/containers/CenterPanelContainer";
import { RightPanelContainer } from "@/containers/RightPanelContainer";
import { SettingsModal } from "@/components/SettingsModal";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationToast } from "@/components/NotificationToast";
import { ThemeProvider } from "@/shared/hooks/useTheme";
import { PlaybackFooter } from "@/features/preview/components/PlaybackFooter";

const TAB_META = {
  view: {
    title: "Preview",
    subtitle: "",
    icon: <FiEye size={18} />,
  },
  gcode: {
    title: "G-code",
    subtitle: "",
    icon: <FiCode size={18} />,
  },
  edit: {
    title: "Constructor",
    subtitle: "",
    icon: <FiTool size={18} />,
  },
  console: {
    title: "Console",
    subtitle: "",
    icon: <FiTerminal size={18} />,
  },
};

function AppContent() {
  const { t } = useTranslation();
  const {
    parsed,
    isParsing,
    fileName,
    handleFileChange,
    playing,
    setPlaying,
    resetPlayback,
    progress,
    setProgress,
    speed,
    setSpeed,
  } = useGCode();

  const { activeTab, setActiveTab, isSettingsOpen, setIsSettingsOpen } = useUI();
  const { settings, updateSettings } = useSettings();

  const tabMeta = {
    ...TAB_META[activeTab as keyof typeof TAB_META],
    title: t(`tabs.${activeTab}`),
    subtitle: t(`header.${activeTab}_desc`),
  };

  const showToolpath = settings.preview.showToolpath;

  if (!parsed || isParsing) {
    return (
      <div className="ui-app-shell">
        <div className="grid h-screen place-items-center p-6">
          <div className="ui-panel w-full max-w-[520px] bg-panel-solid p-7 text-center shadow-standard">
            <div className="mx-auto mb-[18px] grid h-[72px] w-[72px] place-items-center rounded-xl bg-primary-soft text-primary">
              <FiLoader size={34} className="animate-spin" />
            </div>

            <h1 className="m-0 text-[28px] font-extrabold text-text">GCode Studio</h1>

            <p className="my-[10px] mb-[18px] text-text-muted">
              {isParsing
                ? t("startup.parsing")
                : t("startup.upload_prompt")}
            </p>

            {!isParsing && (
              <input
                type="file"
                accept=".gcode,.nc,.tap,.txt"
                onChange={handleFileChange}
                className="ui-input"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const isFullWidth = activeTab === "console" || activeTab === "gcode";

  return (
    <>
    <MainLayout
      header={
        <AppHeader
          fileName={fileName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabMeta={tabMeta}
        />
      }
      leftPanel={!isFullWidth && <LeftPanelContainer />}
      centerPanel={<CenterPanelContainer />}
      rightPanel={!isFullWidth && <RightPanelContainer />}
      bottomBar={
        activeTab === "view" ? (
          <PlaybackFooter
            playing={playing}
            onPlayPause={() => setPlaying(!playing)}
            onResetPlayback={resetPlayback}
            progress={progress}
            onProgressChange={setProgress}
            speed={speed}
            onSpeedChange={setSpeed}
            showToolpath={showToolpath}
            onToggleToolpath={() =>
              updateSettings((prev) => ({
                ...prev,
                preview: {
                  ...prev.preview,
                  showToolpath: !prev.preview.showToolpath,
                },
              }))
            }
          />
        ) : undefined
      }
    />
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <NotificationProvider>
          <AppContent />
          <NotificationToast />
        </NotificationProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
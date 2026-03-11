import { FiCode, FiEye, FiLoader, FiTool } from "react-icons/fi";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { MainLayout } from "@/layouts/MainLayout";
import { AppHeader } from "@/components/AppHeader";
import { LeftPanelContainer } from "@/containers/LeftPanelContainer";
import { CenterPanelContainer } from "@/containers/CenterPanelContainer";
import { RightPanelContainer } from "@/containers/RightPanelContainer";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationToast } from "@/components/NotificationToast";
import { ThemeProvider } from "@/shared/hooks/useTheme";
import { PlaybackFooter } from "@/features/preview/components/PlaybackFooter";

const TAB_META = {
  view: {
    title: "3D-превью",
    subtitle: "Просмотр траектории, заготовки и хода инструмента",
    icon: <FiEye size={18} />,
  },
  gcode: {
    title: "G-code",
    subtitle: "Редактирование, вставка команд и быстрый экспорт",
    icon: <FiCode size={18} />,
  },
  edit: {
    title: "Конструктор",
    subtitle: "Создание геометрии и генерация G-code",
    icon: <FiTool size={18} />,
  },
};

function AppContent() {
  const {
    parsed,
    isParsing,
    fileName,
    activeTab,
    setActiveTab,
    handleFileChange,
    playing,
    setPlaying,
    resetPlayback,
    progress,
    setProgress,
    speed,
    setSpeed
  } = useApp();

  const tabMeta = TAB_META[activeTab as keyof typeof TAB_META];

  if (!parsed || isParsing) {
    return (
      <div className="ui-app-shell">
        <div className="grid h-screen place-items-center p-6">
          <div className="ui-panel w-full max-w-[520px] bg-[var(--color-panel-solid)] p-7 text-center">
            <div className="mx-auto mb-[18px] grid h-[72px] w-[72px] place-items-center rounded-[24px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <FiLoader size={34} className="animate-spin" />
            </div>

            <h1 className="m-0 text-[28px]">GCode Studio</h1>

            <p className="my-[10px] mb-[18px] text-[var(--color-text-muted)]">
              {isParsing
                ? "Парсинг G-code... Это может занять несколько секунд."
                : "Загрузите файл, чтобы начать работу."}
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

  return (
    <MainLayout
      header={
        <AppHeader
          fileName={fileName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabMeta={tabMeta}
        />
      }
      leftPanel={<LeftPanelContainer />}
      centerPanel={<CenterPanelContainer />}
      rightPanel={<RightPanelContainer />}
      bottomBar={activeTab === "view" ? (
        <PlaybackFooter
          playing={playing}
          onPlayPause={() => setPlaying(!playing)}
          onResetPlayback={resetPlayback}
          progress={progress}
          onProgressChange={setProgress}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      ) : undefined}
    />
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

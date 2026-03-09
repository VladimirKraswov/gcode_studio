// src/App.tsx
import { FiCode, FiEye, FiLoader, FiTool } from "react-icons/fi";
import { AppProvider, useApp } from "./contexts/AppContext";
import { MainLayout } from "./layouts/MainLayout";
import { AppHeader } from "./components/AppHeader";
import { LeftPanelContainer } from "./containers/LeftPanelContainer";
import { CenterPanelContainer } from "./containers/CenterPanelContainer";
import { RightPanelContainer } from "./containers/RightPanelContainer";
import { theme, ui } from "./styles/ui";

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
  const { parsed, isParsing, fileName, activeTab, setActiveTab, handleFileChange } = useApp();
  const tabMeta = TAB_META[activeTab];

  if (!parsed || isParsing) {
    return (
      <div style={ui.appShell}>
        <div
          style={{
            height: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              ...ui.panel,
              width: "min(520px, 100%)",
              padding: 28,
              textAlign: "center",
              background: theme.panelSolid,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 18px",
                borderRadius: 24,
                display: "grid",
                placeItems: "center",
                background: theme.primarySoft,
                color: theme.primary,
              }}
            >
              <FiLoader size={34} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 28 }}>GCode Studio</h1>
            <p style={{ color: theme.textMuted, margin: "10px 0 18px" }}>
              {isParsing
                ? "Парсинг G-code... Это может занять несколько секунд."
                : "Загрузите файл, чтобы начать работу."}
            </p>
            {!isParsing && (
              <input
                type="file"
                accept=".gcode,.nc,.tap,.txt"
                onChange={handleFileChange}
                style={ui.input}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      header={<AppHeader fileName={fileName} activeTab={activeTab} onTabChange={setActiveTab} tabMeta={tabMeta} />}
      leftPanel={<LeftPanelContainer />}
      centerPanel={<CenterPanelContainer />}
      rightPanel={<RightPanelContainer />}
    />
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
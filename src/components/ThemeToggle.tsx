import { FiMoon, FiSun } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/shared/hooks/useTheme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="ui-btn-ghost">
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      <span>{isDark ? t("common.light_theme") : t("common.dark_theme")}</span>
    </button>
  );
}
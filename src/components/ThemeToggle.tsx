import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="ui-btn-ghost">
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      <span>{isDark ? "Светлая" : "Тёмная"}</span>
    </button>
  );
}
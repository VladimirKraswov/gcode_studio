// src/components/ThemeToggle.tsx
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";
import { useStyles } from "../styles/useStyles";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const styles = useStyles();

  return (
    <button onClick={toggleTheme} style={styles.buttonGhost}>
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      <span>{isDark ? "Светлая" : "Тёмная"}</span>
    </button>
  );
}
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useStyles } from "../../styles/useStyles";
import { useTheme } from "../../contexts/ThemeContext";

type CollapsibleSectionProps = {
  title: string;
  icon: React.ReactNode;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  onToggle?: (collapsed: boolean) => void;
};

export function CollapsibleSection({
  title,
  icon,
  defaultCollapsed = false,
  children,
  onToggle,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const styles = useStyles();
  const { theme } = useTheme();

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggle?.(newState);
  };

  return (
    <section style={{ ...styles.panel, padding: 16 }}>
      <div
        onClick={handleToggle}
        style={{
          ...styles.panelHeader,
          cursor: "pointer",
          marginBottom: collapsed ? 0 : 14,
        }}
      >
        <h3 style={styles.sectionTitle}>
          <div style={styles.iconBadge}>{icon}</div>
          <span>{title}</span>
        </h3>
        <div style={{ color: theme.textSoft }}>
          {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
        </div>
      </div>
      {!collapsed && children}
    </section>
  );
}
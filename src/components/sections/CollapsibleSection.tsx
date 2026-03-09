import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { theme, ui } from "../../styles/ui";

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

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggle?.(newState);
  };

  return (
    <section style={{ ...ui.panel, padding: 16 }}>
      <div
        onClick={handleToggle}
        style={{
          ...ui.panelHeader,
          cursor: "pointer",
          marginBottom: collapsed ? 0 : 14,
        }}
      >
        <h3 style={ui.sectionTitle}>
          <div style={ui.iconBadge}>{icon}</div>
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
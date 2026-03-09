// src/modules/cad/panels/settings/CollapsibleCardBlock.tsx
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useTheme } from "../../../../contexts/ThemeContext";

type CollapsibleCardBlockProps = {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
};

export function CollapsibleCardBlock({ title, children, defaultCollapsed = false }: CollapsibleCardBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme.panelSolid,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: 12,
        minWidth: 0,
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{title}</div>
        <div style={{ color: theme.textSoft }}>
          {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
        </div>
      </div>
      {!collapsed && children}
    </div>
  );
}
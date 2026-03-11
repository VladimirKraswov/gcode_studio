import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Badge } from "../ui/Badge";
import { Panel } from "../ui/Panel";

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
    <Panel className="p-4">
      <div
        onClick={handleToggle}
        className={`flex cursor-pointer items-center justify-between gap-3 ${
          collapsed ? "mb-0" : "mb-3.5"
        }`}
      >
        <div className="flex items-center gap-2.5 text-base font-bold text-text">
          <Badge variant="primary" icon={icon} />
          <span>{title}</span>
        </div>
        <div className="text-text-soft">
          {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
        </div>
      </div>
      {!collapsed && children}
    </Panel>
  );
}
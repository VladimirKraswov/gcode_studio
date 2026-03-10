import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

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
    <section className="ui-panel p-4">
      <div
        onClick={handleToggle}
        className={`flex cursor-pointer items-center justify-between gap-3 ${
          collapsed ? "mb-0" : "mb-3.5"
        }`}
      >
        <h3 className="m-0 flex items-center gap-2.5 text-base font-bold text-[var(--color-text)]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
            {icon}
          </div>
          <span>{title}</span>
        </h3>

        <div className="text-[var(--color-text-soft)]">
          {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
        </div>
      </div>

      {!collapsed && children}
    </section>
  );
}
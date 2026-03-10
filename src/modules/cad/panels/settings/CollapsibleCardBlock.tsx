// src/modules/cad/panels/settings/CollapsibleCardBlock.tsx
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

type CollapsibleCardBlockProps = {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
};

export function CollapsibleCardBlock({
  title,
  children,
  defaultCollapsed = false,
}: CollapsibleCardBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="min-w-0 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-3">
      <div
        onClick={() => setCollapsed(!collapsed)}
        className={`flex cursor-pointer items-center justify-between ${
          collapsed ? "mb-0" : "mb-2.5"
        }`}
      >
        <div className="text-[13px] font-extrabold text-[var(--color-text)]">
          {title}
        </div>

        <div className="text-[var(--color-text-soft)]">
          {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
        </div>
      </div>

      {!collapsed && children}
    </div>
  );
}
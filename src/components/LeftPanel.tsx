import type { ReactNode } from "react";

type LeftPanelProps = {
  children: ReactNode;
};

export function LeftPanel({ children }: LeftPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 scrollbar-thin">
      {children}
    </div>
  );
}

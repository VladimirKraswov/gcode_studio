import type { ReactNode } from "react";

type RightPanelProps = {
  children: ReactNode;
};

export function RightPanel({ children }: RightPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 scrollbar-thin">
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

type RightPanelProps = {
  children: ReactNode;
};

export function RightPanel({ children }: RightPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {children}
    </div>
  );
}

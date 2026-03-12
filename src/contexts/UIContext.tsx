import { createContext, useContext, type ReactNode } from "react";
import { type MainTab } from "@/types/ui";

export interface UIContextValue {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
}

export const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children, value }: { children: ReactNode; value: UIContextValue }) {
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

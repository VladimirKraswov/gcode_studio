import { createContext, useContext, type ReactNode } from "react";
import { type UserSettings } from "@/shared/utils/settings";

export interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (update: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children, value }: { children: ReactNode; value: SettingsContextValue }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// src/contexts/AppContext.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { SettingsProvider } from './SettingsContext';
import { UIProvider } from './UIContext';
import { GCodeProvider } from './GCodeContext';
import { CadProvider } from './CadContext';

type AppContextType = ReturnType<typeof useAppState>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  const { ui, settings, gcode, cad } = state;

  return (
    <UIProvider value={ui}>
      <SettingsProvider value={settings}>
        <GCodeProvider value={gcode}>
          <CadProvider value={cad}>
            <AppContext.Provider value={state}>{children}</AppContext.Provider>
          </CadProvider>
        </GCodeProvider>
      </SettingsProvider>
    </UIProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// src/contexts/AppContext.tsx
import React, { createContext, useContext } from 'react';
import { useAppState } from '../hooks/useAppState';
import type { ReactNode } from 'react';

type AppContextType = ReturnType<typeof useAppState>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
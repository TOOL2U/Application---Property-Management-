import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { getColors, ColorScheme } from '@/constants/Colors';

interface ThemeContextType {
  theme: ColorScheme;
  themeMode: ThemeMode;
  colors: ReturnType<typeof getColors>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeData = useTheme();

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

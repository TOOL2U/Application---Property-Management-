import { useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, ColorScheme } from '@/constants/Colors';

const THEME_STORAGE_KEY = '@theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ColorScheme;
  themeMode: ThemeMode;
  colors: ReturnType<typeof getColors>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
}

export function useTheme(): ThemeContextType {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorScheme>(
    (Appearance.getColorScheme() as ColorScheme) || 'light'
  );

  // Determine actual theme based on mode
  const theme: ColorScheme = themeMode === 'system' ? systemTheme : themeMode;
  const colors = getColors(theme);
  const isSystemTheme = themeMode === 'system';

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme((colorScheme as ColorScheme) || 'light');
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark (ignores system)
  const toggleTheme = () => {
    const newMode = theme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  return {
    theme,
    themeMode,
    colors,
    setThemeMode,
    toggleTheme,
    isSystemTheme,
  };
}

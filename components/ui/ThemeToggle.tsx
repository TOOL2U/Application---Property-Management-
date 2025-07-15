import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useDesignTokens } from '@/constants/Design';

export default function ThemeToggle() {
  const { themeMode, setThemeMode, theme } = useThemeContext();
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();

  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  const themeOptions = [
    { mode: 'light' as const, icon: Sun, label: 'Light' },
    { mode: 'dark' as const, icon: Moon, label: 'Dark' },
    { mode: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <View style={styles.optionsContainer}>
        {themeOptions.map(({ mode, icon: Icon, label }) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.option,
              themeMode === mode && styles.selectedOption,
            ]}
            onPress={() => setThemeMode(mode)}
          >
            <Icon 
              size={20} 
              color={themeMode === mode ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.optionText,
              themeMode === mode && styles.selectedOptionText,
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.currentTheme}>
        Current: {theme === 'dark' ? 'Dark' : 'Light'} theme
      </Text>
    </View>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  title: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: Spacing[3],
  },
  optionsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BorderRadius.default,
    padding: Spacing[1],
    marginBottom: Spacing[3],
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.sm,
    gap: Spacing[2],
  },
  selectedOption: {
    backgroundColor: colors.surface,
    ...Shadows.sm,
  },
  optionText: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: colors.text.secondary,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  currentTheme: {
    ...Typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

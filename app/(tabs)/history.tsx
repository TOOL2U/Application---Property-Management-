import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History } from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

export default function HistoryScreen() {
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.placeholder}>
          <History size={48} color={colors.text.tertiary} />
          <Text style={styles.placeholderTitle}>History Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Your job history and completed tasks will be available here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingVertical: Spacing[4],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.mobile.screenPadding,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[12],
  },
  placeholderTitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: colors.text.primary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  placeholderText: {
    ...Typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing[8],
  },
});

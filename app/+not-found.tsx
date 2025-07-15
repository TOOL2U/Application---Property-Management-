import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, ArrowLeft } from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();

  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Home size={64} color={colors.text.tertiary} />
        </View>
        
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <ArrowLeft size={20} color={colors.text.inverse} />
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.mobile.screenPadding,
  },
  iconContainer: {
    marginBottom: Spacing[8],
  },
  title: {
    ...Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  subtitle: {
    ...Typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  buttonText: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.inverse,
    marginLeft: Spacing[2],
  },
});

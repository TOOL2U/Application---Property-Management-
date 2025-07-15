import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, ArrowLeft } from 'lucide-react-native';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Home size={64} color={NeumorphicTheme.colors.text.tertiary} />
        </View>
        
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <ArrowLeft size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[6],
  },
  iconContainer: {
    marginBottom: NeumorphicTheme.spacing[8],
  },
  title: {
    fontSize: NeumorphicTheme.typography.sizes['3xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: NeumorphicTheme.spacing[4],
  },
  subtitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: NeumorphicTheme.spacing[8],
    paddingHorizontal: NeumorphicTheme.spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NeumorphicTheme.colors.brand.primary,
    paddingHorizontal: NeumorphicTheme.spacing[6],
    paddingVertical: NeumorphicTheme.spacing[4],
    borderRadius: NeumorphicTheme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonText: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: '#ffffff',
    marginLeft: NeumorphicTheme.spacing[2],
  },
});

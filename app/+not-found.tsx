import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLORS } from '@/constants/BrandTheme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="home-outline" size={64} color={BRAND_COLORS.TEXT_MUTED} />
        </View>
        
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(auth)/select-profile')}
        >
          <Ionicons name="arrow-back" size={20} color={BRAND_COLORS.BLACK} />
          <Text style={styles.buttonText}>Go to Profile Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.GREY_PRIMARY,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BRAND_COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.YELLOW,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 0, // Sharp corners per brand
    elevation: 2,
    shadowColor: BRAND_COLORS.YELLOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_COLORS.BLACK,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
});

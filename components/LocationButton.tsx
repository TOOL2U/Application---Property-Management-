import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useLocation } from '@/hooks/useLocation';
import { useTaskLocation } from '@/hooks/useTaskLocation';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react-native';

interface LocationButtonProps {
  taskId: string;
  style?: any;
}

export function LocationButton({ taskId, style }: LocationButtonProps) {
  const { currentProfile } = usePINAuth();
  const { hasPermission, loading: locationLoading, requestPermission, getCurrentLocation } = useLocation();
  const { uploading, uploadStaffLocation } = useTaskLocation();

  const handleLocationRequest = async () => {
    if (!user) return;

    try {
      // Request permission if not granted
      if (hasPermission === false || hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access to share your location with the task.'
          );
          return;
        }
      }

      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Unable to get your current location. Please try again.');
        return;
      }

      // Upload location to task
      const success = await uploadStaffLocation(taskId, user.id, location);
      if (success) {
        Alert.alert(
          'Location Shared',
          'Your location has been successfully shared with this task.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to share your location. Please try again.');
      }
    } catch (error) {
      console.error('Location sharing error:', error);
      Alert.alert('Error', 'An unexpected error occurred while sharing your location.');
    }
  };

  const getButtonConfig = () => {
    if (hasPermission === null) {
      return {
        title: 'Enable Location',
        icon: MapPin,
        variant: 'outline' as const,
      };
    }

    if (hasPermission === false) {
      return {
        title: 'Allow Location Access',
        icon: AlertCircle,
        variant: 'outline' as const,
      };
    }

    return {
      title: 'Send My Location',
      icon: Navigation,
      variant: 'primary' as const,
    };
  };

  const buttonConfig = getButtonConfig();
  const isLoading = locationLoading || uploading;

  return (
    <View style={[styles.container, style]}>
      <Button
        title={buttonConfig.title}
        onPress={handleLocationRequest}
        variant={buttonConfig.variant}
        size="sm"
        loading={isLoading}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    minWidth: 140,
  },
});

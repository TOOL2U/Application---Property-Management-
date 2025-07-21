/**
 * GPS Check-In Banner Component
 * Interactive UI for job GPS check-in with FOA integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, CheckCircle, Clock, AlertTriangle, TestTube2 } from 'lucide-react-native';
import { useJobLocationTracking } from '@/hooks/useJobLocationTracking';
import { JobData } from '@/types/jobData';

interface GPSCheckInBannerProps {
  job: JobData;
  onCheckInComplete?: (success: boolean) => void;
  onStartTracking?: () => void;
  testMode?: boolean;
  style?: any;
}

export default function GPSCheckInBanner({
  job,
  onCheckInComplete,
  onStartTracking,
  testMode = false,
  style
}: GPSCheckInBannerProps) {
  const {
    isCheckingIn,
    hasCheckedIn,
    checkInData,
    isTracking,
    hasArrived,
    distanceToProperty,
    foaCheckInMessage,
    foaArrivalMessage,
    error,
    permissionStatus,
    checkInToJob,
    startTracking,
    testCheckIn,
    checkPermissions,
    clearError
  } = useJobLocationTracking({
    enableRealTimeTracking: true,
    enableArrivalDetection: true,
    enableFOAIntegration: true,
    testMode
  });

  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCheckIn = async () => {
    try {
      clearError();
      const success = testMode ? await testCheckIn(job) : await checkInToJob(job);
      
      if (success && onCheckInComplete) {
        onCheckInComplete(true);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      if (onCheckInComplete) {
        onCheckInComplete(false);
      }
    }
  };

  const handleStartTracking = async () => {
    try {
      clearError();
      const success = await startTracking(job);
      
      if (success && onStartTracking) {
        onStartTracking();
      }
    } catch (error) {
      console.error('Start tracking failed:', error);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await checkPermissions();
    if (!granted) {
      Alert.alert(
        'Location Access Required',
        'This app needs location access for GPS check-in and job tracking. Please enable location permissions in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // Could open device settings here
            console.log('Open settings requested');
          }}
        ]
      );
    }
  };

  const getStatusColor = () => {
    if (hasCheckedIn) return '#10b981';
    if (hasArrived) return '#3b82f6';
    if (isTracking) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (hasCheckedIn && hasArrived) return 'Arrived & Checked In';
    if (hasCheckedIn) return 'Checked In';
    if (hasArrived) return 'Arrived at Location';
    if (isTracking) return 'Tracking Active';
    return 'Ready for Check-In';
  };

  const getStatusIcon = () => {
    if (hasCheckedIn) return CheckCircle;
    if (hasArrived) return Navigation;
    if (isTracking) return Clock;
    return MapPin;
  };

  const StatusIcon = getStatusIcon();

  if (permissionStatus === 'denied') {
    return (
      <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.05)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <AlertTriangle size={24} color="#ef4444" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Location Permission Required</Text>
              <Text style={styles.subtitle}>Enable GPS access for check-in</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.permissionButton]}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.permissionButtonText}>Enable Location Access</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'rgba(79, 70, 229, 0.05)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <StatusIcon size={24} color={getStatusColor()} />
          <View style={styles.headerText}>
            <Text style={styles.title}>GPS Check-In</Text>
            <Text style={[styles.subtitle, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          {testMode && (
            <View style={styles.testBadge}>
              <TestTube2 size={16} color="#8b5cf6" />
              <Text style={styles.testText}>TEST</Text>
            </View>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {job.propertyRef?.name || job.location?.address || 'Job Location'}
          </Text>
          {distanceToProperty !== null && (
            <Text style={styles.distanceText}>
              📏 {Math.round(distanceToProperty)}m away
            </Text>
          )}
        </View>

        {/* FOA Messages */}
        {foaCheckInMessage && (
          <View style={styles.foaMessage}>
            <Text style={styles.foaLabel}>🧠 FOA Message:</Text>
            <Text style={styles.foaText}>{foaCheckInMessage}</Text>
          </View>
        )}

        {foaArrivalMessage && (
          <View style={styles.foaMessage}>
            <Text style={styles.foaLabel}>🎯 Arrival Update:</Text>
            <Text style={styles.foaText}>{foaArrivalMessage}</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!hasCheckedIn ? (
            <TouchableOpacity
              style={[styles.button, styles.checkInButton]}
              onPress={handleCheckIn}
              disabled={isCheckingIn}
            >
              <MapPin size={18} color="#ffffff" />
              <Text style={styles.buttonText}>
                {isCheckingIn ? 'Checking In...' : (testMode ? 'Test Check-In' : 'Check In')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.checkedInStatus}>
              <CheckCircle size={18} color="#10b981" />
              <Text style={styles.checkedInText}>
                Checked in at {checkInData?.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          )}

          {hasCheckedIn && !isTracking && (
            <TouchableOpacity
              style={[styles.button, styles.trackingButton]}
              onPress={handleStartTracking}
            >
              <Navigation size={18} color="#6366f1" />
              <Text style={[styles.buttonText, { color: '#6366f1' }]}>Start Tracking</Text>
            </TouchableOpacity>
          )}

          {isTracking && (
            <View style={styles.trackingStatus}>
              <Clock size={18} color="#f59e0b" />
              <Text style={styles.trackingText}>Live tracking active</Text>
            </View>
          )}
        </View>

        {/* Feature Indicators */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureText}>🛰️ Real-time tracking</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>🎯 Arrival detection</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>🧠 FOA integration</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  testText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  foaMessage: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  foaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  foaText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#6366f1',
  },
  trackingButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  permissionButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  checkedInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  checkedInText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  trackingText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feature: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});

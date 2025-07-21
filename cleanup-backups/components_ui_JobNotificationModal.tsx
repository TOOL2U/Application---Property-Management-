import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  Navigation,
  X,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Trees,
  Wrench,
  Waves,
} from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

interface JobDetails {
  id: string;
  title: string;
  propertyName: string;
  propertyAddress: string;
  serviceType: 'cleaning' | 'gardening' | 'maintenance' | 'pool' | 'security' | 'inspection';
  scheduledDate: string;
  scheduledTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientName: string;
  clientPhone?: string;
  notes?: string;
  estimatedDuration: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface JobNotificationModalProps {
  visible: boolean;
  job: JobDetails | null;
  onAccept: (jobId: string) => void;
  onDecline: (jobId: string) => void;
  onClose: () => void;
}

const serviceIcons = {
  cleaning: Sparkles,
  gardening: Trees,
  maintenance: Wrench,
  pool: Waves,
  security: AlertTriangle,
  inspection: CheckCircle,
};

export default function JobNotificationModal({
  visible,
  job,
  onAccept,
  onDecline,
  onClose,
}: JobNotificationModalProps) {
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  const [slideAnim] = useState(new Animated.Value(0));
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
    return status;
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    return status;
  };

  const handleNavigateToJob = async () => {
    if (!job) return;

    let permission = locationPermission;
    
    if (permission !== Location.PermissionStatus.GRANTED) {
      permission = await requestLocationPermission();
    }

    if (permission !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to navigate to the job location.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { latitude, longitude } = job.location;
    const destination = `${latitude},${longitude}`;
    const label = encodeURIComponent(job.propertyName);

    // Try to open in native maps app
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${destination}`,
      android: `geo:0,0?q=${destination}(${label})`,
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;

    try {
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(webUrl);
        }
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Unable to open maps application');
    }
  };

  const handleAcceptJob = () => {
    if (job) {
      onAccept(job.id);
      // Log timestamp when job is accepted
      console.log(`Job ${job.id} accepted at:`, new Date().toISOString());
    }
  };

  const handleDeclineJob = () => {
    if (job) {
      Alert.alert(
        'Decline Job',
        'Are you sure you want to decline this job assignment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Decline', 
            style: 'destructive',
            onPress: () => onDecline(job.id)
          },
        ]
      );
    }
  };

  const handleCallClient = () => {
    if (job?.clientPhone) {
      Linking.openURL(`tel:${job.clientPhone}`);
    }
  };

  if (!job) return null;

  const ServiceIcon = serviceIcons[job.serviceType];
  const priorityColor = colors.priority[job.priority];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.serviceIconContainer, { backgroundColor: `${priorityColor}20` }]}>
                  <ServiceIcon size={24} color={priorityColor} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.modalTitle}>New Job Assignment</Text>
                  <View style={styles.priorityBadge}>
                    <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                      {job.priority.toUpperCase()} PRIORITY
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Job Details */}
              <View style={styles.section}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.serviceType}>{job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)} Service</Text>
              </View>

              {/* Property Information */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MapPin size={20} color={colors.text.secondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Property</Text>
                    <Text style={styles.infoValue}>{job.propertyName}</Text>
                    <Text style={styles.infoSubtext}>{job.propertyAddress}</Text>
                  </View>
                </View>
              </View>

              {/* Schedule Information */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Clock size={20} color={colors.text.secondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Scheduled</Text>
                    <Text style={styles.infoValue}>
                      {new Date(job.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.infoSubtext}>
                      {job.scheduledTime} • Est. {job.estimatedDuration}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Client Information */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <User size={20} color={colors.text.secondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Client</Text>
                    <Text style={styles.infoValue}>{job.clientName}</Text>
                    {job.clientPhone && (
                      <TouchableOpacity onPress={handleCallClient} style={styles.phoneButton}>
                        <Phone size={16} color={colors.primary} />
                        <Text style={styles.phoneText}>{job.clientPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Notes */}
              {job.notes && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <MessageSquare size={20} color={colors.text.secondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Special Instructions</Text>
                      <Text style={styles.notesText}>{job.notes}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Navigation Button */}
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleNavigateToJob}
              >
                <Navigation size={20} color={colors.text.inverse} />
                <Text style={styles.navigationText}>Navigate to Job Location</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineJob}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptJob}
              >
                <Text style={styles.acceptButtonText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.mobile.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: Spacing[1],
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing[2],
  },
  priorityText: {
    ...Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  closeButton: {
    padding: Spacing[2],
  },
  content: {
    flex: 1,
    padding: Spacing.mobile.screenPadding,
  },
  section: {
    marginBottom: Spacing[6],
  },
  jobTitle: {
    ...Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: colors.text.primary,
    marginBottom: Spacing[1],
  },
  serviceType: {
    ...Typography.sizes.base,
    color: colors.text.secondary,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  infoLabel: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: Spacing[1],
  },
  infoValue: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: Spacing[1],
  },
  infoSubtext: {
    ...Typography.sizes.sm,
    color: colors.text.tertiary,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  phoneText: {
    ...Typography.sizes.sm,
    color: colors.primary,
    marginLeft: Spacing[2],
    fontWeight: Typography.weights.medium,
  },
  notesText: {
    ...Typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginTop: Spacing[4],
    marginBottom: Spacing[6],
    ...Shadows.sm,
  },
  navigationText: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.inverse,
    marginLeft: Spacing[2],
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.mobile.screenPadding,
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: Spacing[3],
  },
  declineButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.error,
  },
  acceptButton: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  acceptButtonText: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.inverse,
  },
});

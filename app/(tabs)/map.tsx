import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  User,
  Phone,
  MessageCircle,
  CheckCircle,
  X,
  Star,
  Zap,
  Home,
} from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Property Management Job Assignment Data
const mockMaintenanceAssignment = {
  id: 'maint_001',
  title: 'Emergency Plumbing Repair',
  propertyName: 'Oceanview Apartments - Unit 4B',
  address: '2847 Coastal Drive, Miami Beach, FL 33139',
  tenantName: 'Maria Rodriguez',
  tenantPhone: '(305) 555-0123',
  propertyManagerRating: 4.6,
  estimatedDuration: '2-3 hours',
  priority: 'urgent',
  distance: '1.8 miles',
  estimatedArrival: '12 mins',
  issueType: 'plumbing',
  description: 'Kitchen sink leak causing water damage to cabinet. Tenant reports water pooling under sink and potential damage to flooring.',
  requiredTools: ['Pipe wrench', 'Plumbing snake', 'Pipe sealant', 'Replacement parts'],
  safetyNotes: 'Turn off water main before starting work. Check for electrical hazards near water damage.',
  tenantAvailability: 'Available until 6:00 PM',
  coordinates: { lat: 25.7617, lng: -80.1918 },
  propertyDetails: {
    type: 'Apartment Complex',
    units: 48,
    yearBuilt: 2018,
    lastMaintenance: '2 weeks ago'
  }
};

export default function JobAssignmentScreen() {
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  const [jobStatus, setJobStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [slideAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulse animation for accept button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleAcceptJob = () => {
    setJobStatus('accepted');
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleDeclineJob = () => {
    setJobStatus('declined');
    Animated.timing(slideAnimation, {
      toValue: -1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const JobCard = () => (
    <View style={styles.jobCard}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']}
        style={styles.jobCardGradient}
      >
        <BlurView intensity={20} style={styles.jobCardBlur}>
          <View style={styles.jobCardContent}>
            {/* Header */}
            <View style={styles.jobCardHeader}>
              <View style={styles.jobCardHeaderLeft}>
                <Text style={styles.jobTitle}>{mockMaintenanceAssignment.title}</Text>
                <Text style={styles.propertyName}>{mockMaintenanceAssignment.propertyName}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: '#ef444420', borderColor: '#ef4444' }]}>
                <Text style={[styles.priorityText, { color: '#ef4444' }]}>URGENT</Text>
              </View>
            </View>

            {/* Tenant Info */}
            <View style={styles.tenantInfo}>
              <View style={styles.tenantAvatar}>
                <User size={20} color="#3b82f6" />
              </View>
              <View style={styles.tenantDetails}>
                <Text style={styles.tenantName}>{mockMaintenanceAssignment.tenantName}</Text>
                <Text style={styles.tenantAvailability}>Available: {mockMaintenanceAssignment.tenantAvailability}</Text>
              </View>
              <View style={styles.tenantActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Phone size={16} color="#22c55e" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle size={16} color="#8b5cf6" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.locationSection}>
              <MapPin size={18} color="#f59e0b" />
              <Text style={styles.addressText}>{mockMaintenanceAssignment.address}</Text>
            </View>

            {/* Maintenance Details */}
            <View style={styles.maintenanceDetails}>
              <View style={styles.detailItem}>
                <Clock size={16} color="#8b5cf6" />
                <Text style={styles.detailText}>{mockMaintenanceAssignment.estimatedDuration}</Text>
              </View>
              <View style={styles.detailItem}>
                <Zap size={16} color="#ef4444" />
                <Text style={styles.detailText}>{mockMaintenanceAssignment.issueType.toUpperCase()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Navigation size={16} color="#f59e0b" />
                <Text style={styles.detailText}>{mockMaintenanceAssignment.distance}</Text>
              </View>
            </View>

            {/* Issue Description */}
            <Text style={styles.issueDescription}>{mockMaintenanceAssignment.description}</Text>

            {/* Safety Notes */}
            <View style={styles.safetySection}>
              <Text style={styles.safetyTitle}>Safety Notes:</Text>
              <Text style={styles.safetyText}>{mockMaintenanceAssignment.safetyNotes}</Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#111111', '#1a1a1a']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={20} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Job Assignment</Text>
            <Text style={styles.subtitle}>New job available nearby</Text>
          </View>
          <View style={styles.headerIcon}>
            <Zap size={24} color="#f59e0b" />
          </View>
        </BlurView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Map Placeholder */}
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
              style={styles.mapGradient}
            >
              <BlurView intensity={15} style={styles.mapBlur}>
                <View style={styles.mapContent}>
                  <MapPin size={48} color="#f59e0b" />
                  <Text style={styles.mapText}>Interactive Map</Text>
                  <Text style={styles.mapSubtext}>
                    {mockMaintenanceAssignment.distance} • {mockMaintenanceAssignment.estimatedArrival}
                  </Text>
                </View>
              </BlurView>
            </LinearGradient>
          </View>

          {/* Job Card */}
          <JobCard />

          {/* Action Buttons */}
          {jobStatus === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineJob}
              >
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.2)']}
                  style={styles.declineGradient}
                >
                  <X size={24} color="#ef4444" />
                  <Text style={styles.declineText}>Decline</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Animated.View style={[styles.acceptButtonContainer, { transform: [{ scale: pulseAnimation }] }]}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleAcceptJob}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.acceptGradient}
                  >
                    <CheckCircle size={28} color="#ffffff" />
                    <Text style={styles.acceptText}>Accept Job</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* Status Messages */}
          {jobStatus === 'accepted' && (
            <View style={styles.statusMessage}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.3)', 'rgba(16, 185, 129, 0.1)']}
                style={styles.statusGradient}
              >
                <BlurView intensity={15} style={styles.statusBlur}>
                  <CheckCircle size={32} color="#22c55e" />
                  <Text style={styles.statusTitle}>Job Accepted!</Text>
                  <Text style={styles.statusSubtitle}>Navigate to location to begin</Text>
                </BlurView>
              </LinearGradient>
            </View>
          )}

          {jobStatus === 'declined' && (
            <View style={styles.statusMessage}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.1)']}
                style={styles.statusGradient}
              >
                <BlurView intensity={15} style={styles.statusBlur}>
                  <X size={32} color="#ef4444" />
                  <Text style={styles.statusTitle}>Job Declined</Text>
                  <Text style={styles.statusSubtitle}>Looking for new assignments...</Text>
                </BlurView>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: -0.2,
    marginTop: Spacing[1],
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },

  // Map Section
  mapContainer: {
    height: 200,
    marginHorizontal: Spacing.mobile.screenPadding,
    marginTop: Spacing[6],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  mapGradient: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  mapBlur: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContent: {
    alignItems: 'center',
  },
  mapText: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: '#ffffff',
    marginTop: Spacing[3],
    letterSpacing: -0.3,
  },
  mapSubtext: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing[1],
    letterSpacing: -0.2,
  },

  // Job Card
  jobCard: {
    marginHorizontal: Spacing.mobile.screenPadding,
    marginTop: Spacing[6],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  jobCardGradient: {
    borderRadius: BorderRadius.lg,
  },
  jobCardBlur: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobCardContent: {
    padding: Spacing[5],
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  jobCardHeaderLeft: {
    flex: 1,
  },
  jobTitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  propertyName: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing[1],
    letterSpacing: -0.2,
  },
  priorityBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  priorityText: {
    ...Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },

  // Client Info
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  clientDetails: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  clientName: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  clientRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
    gap: Spacing[1],
  },
  ratingText: {
    ...Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.weights.medium,
  },
  clientActions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Location Section
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  addressText: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // Job Details
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  detailText: {
    ...Typography.sizes.sm,
    color: '#ffffff',
    fontWeight: Typography.weights.medium,
    letterSpacing: -0.2,
  },

  // Job Description
  jobDescription: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[4],
  },
  declineButton: {
    flex: 1,
    height: 60,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  declineGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BorderRadius.lg,
  },
  declineText: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: '#ef4444',
    letterSpacing: -0.2,
  },
  acceptButtonContainer: {
    flex: 2,
  },
  acceptButton: {
    height: 60,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  acceptGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderRadius: BorderRadius.lg,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  acceptText: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },

  // Status Messages
  statusMessage: {
    marginHorizontal: Spacing.mobile.screenPadding,
    marginTop: Spacing[6],
    marginBottom: Spacing[8],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statusGradient: {
    borderRadius: BorderRadius.lg,
  },
  statusBlur: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[6],
  },
  statusTitle: {
    ...Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    marginTop: Spacing[3],
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    ...Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing[2],
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

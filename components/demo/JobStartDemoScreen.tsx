/**
 * Job Start Demo Screen
 * Demonstrates the complete job start workflow implementation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Star, CheckCircle } from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import StartJobButton from '../jobs/StartJobButton';

// Mock job data for demonstration
const mockJob: JobData = {
  id: 'demo_job_001',
  title: '🏖️ DEMO: Villa Cleaning & Preparation',
  description: 'Complete villa cleaning and preparation for incoming guests. Focus on pool area, all bedrooms, and common areas.',
  jobType: 'cleaning',
  priority: 'high',
  scheduledDate: new Date().toISOString(),
  scheduledStartTime: '14:00',
  estimatedDuration: 120, // 2 hours
  assignedStaffId: 'demo_staff_001',
  userId: 'demo_user_001',
  status: 'assigned',
  propertyId: 'demo_property_001',
  propertyRef: {
    id: 'demo_property_001',
    name: 'Sunset Villa Demo',
    address: '123 Demo Beach Road, Paradise Island',
    coordinates: {
      latitude: 9.7601,
      longitude: 100.0356,
    },
  },
  location: {
    address: '123 Demo Beach Road, Paradise Island',
    coordinates: {
      latitude: 9.7601,
      longitude: 100.0356,
    },
    accessInstructions: 'Use keypad code 9876. Main gate closes automatically after 30 seconds.',
    parkingInstructions: 'Park in designated staff area on the left side of the driveway.',
  },
  specialInstructions: 'Please pay special attention to the pool area and outdoor furniture. Check all amenities are working properly.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function JobStartDemoScreen() {
  const handleJobStarted = () => {
    Alert.alert(
      'Demo Complete! 🎉',
      'The job start workflow has been successfully demonstrated. In a real app, you would now navigate to the job execution screen.',
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const WorkflowFeature = ({ 
    icon, 
    title, 
    description, 
    isEnabled = true 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    isEnabled?: boolean; 
  }) => (
    <View style={[styles.featureItem, !isEnabled && styles.featureDisabled]}>
      <View style={styles.featureIcon}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, !isEnabled && styles.featureDisabledText]}>
          {title}
        </Text>
        <Text style={[styles.featureDescription, !isEnabled && styles.featureDisabledText]}>
          {description}
        </Text>
      </View>
      {isEnabled && (
        <CheckCircle size={20} color="#10b981" style={styles.featureCheck} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Staff Job Start Workflow</Text>
            <Text style={styles.headerSubtitle}>
              Complete 5-step process with GPS tracking, confirmation modals, and Firestore integration
            </Text>
          </View>

          {/* Demo Job Card */}
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{mockJob.title}</Text>
              <View style={[styles.priorityBadge, styles.highPriorityBadge]}>
                <Text style={styles.priorityText}>HIGH PRIORITY</Text>
              </View>
            </View>
            
            <Text style={styles.jobDescription}>{mockJob.description}</Text>
            
            <View style={styles.jobDetails}>
              <View style={styles.jobDetailItem}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.jobDetailText}>
                  {mockJob.location?.address}
                </Text>
              </View>
              
              <View style={styles.jobDetailItem}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.jobDetailText}>
                  {mockJob.scheduledStartTime} • {mockJob.estimatedDuration} min
                </Text>
              </View>
              
              <View style={styles.jobDetailItem}>
                <Star size={16} color="#6b7280" />
                <Text style={styles.jobDetailText}>
                  Pool area focus • Guest arrival preparation
                </Text>
              </View>
            </View>

            {/* Start Job Button */}
            <View style={styles.buttonContainer}>
              <StartJobButton
                job={mockJob}
                variant="primary"
                size="large"
                onJobStarted={handleJobStarted}
              />
            </View>
          </View>

          {/* Workflow Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Workflow Features</Text>
            <Text style={styles.sectionDescription}>
              This implementation includes all requested features for the staff job start process:
            </Text>
            
            <View style={styles.featuresList}>
              <WorkflowFeature
                icon={<CheckCircle size={24} color="#3b82f6" />}
                title="1. Confirmation Modal"
                description="Interactive job details confirmation with job info, location, and duration display"
              />
              
              <WorkflowFeature
                icon={<MapPin size={24} color="#10b981" />}
                title="2. GPS Location Logging"
                description="Real-time GPS capture with address geocoding and map preview display"
              />
              
              <WorkflowFeature
                icon={<CheckCircle size={24} color="#f59e0b" />}
                title="3. Job Status Updates"
                description="Automatic job status change to 'in_progress' with Firestore integration"
              />
              
              <WorkflowFeature
                icon={<CheckCircle size={24} color="#8b5cf6" />}
                title="4. Optional Checklist"
                description="Dynamic checklist based on job type with required/optional items"
              />
              
              <WorkflowFeature
                icon={<CheckCircle size={24} color="#ef4444" />}
                title="5. Job Execution Phase"
                description="Photo upload capabilities and progress notes with session tracking"
              />
            </View>
          </View>

          {/* Technical Implementation */}
          <View style={styles.technicalSection}>
            <Text style={styles.sectionTitle}>Technical Integration</Text>
            <Text style={styles.sectionDescription}>
              Built on existing infrastructure for seamless integration:
            </Text>
            
            <View style={styles.techList}>
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>🔥 Firebase Integration</Text>
                <Text style={styles.techDescription}>
                  Uses existing jobLocationTrackingService and staffJobService
                </Text>
              </View>
              
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>📍 GPS Tracking System</Text>
                <Text style={styles.techDescription}>
                  Leverages complete GPS check-in and real-time tracking infrastructure
                </Text>
              </View>
              
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>🎯 Job Status Management</Text>
                <Text style={styles.techDescription}>
                  Integrates with existing job status update APIs and notifications
                </Text>
              </View>
              
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>📱 Mobile UI Components</Text>
                <Text style={styles.techDescription}>
                  Reusable components with TypeScript safety and error handling
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>How to Test</Text>
            <Text style={styles.instructionsText}>
              1. Tap the "Start Job" button above{'\n'}
              2. Follow the 5-step workflow process{'\n'}
              3. Grant location permissions when prompted{'\n'}
              4. Complete the pre-job checklist{'\n'}
              5. Experience the full job start process
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ✅ Ready for production deployment with full GPS tracking and job management integration
            </Text>
          </View>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highPriorityBadge: {
    backgroundColor: '#fef2f2',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  jobDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  jobDetails: {
    marginBottom: 20,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  featuresList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  featureDisabled: {
    opacity: 0.5,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featureDisabledText: {
    color: '#9ca3af',
  },
  featureCheck: {
    marginLeft: 8,
  },
  technicalSection: {
    marginBottom: 24,
  },
  techList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  techItem: {
    marginBottom: 16,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  techDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  instructionsSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  instructionsText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  footerText: {
    fontSize: 16,
    color: '#166534',
    textAlign: 'center',
    fontWeight: '500',
  },
});

/**
 * Example Job Detail Screen with FOA Checklist Integration
 * 
 * This demonstrates how to integrate the FOAChecklist component
 * into a job detail screen with the optional FOA chat explanation feature.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import FOAChecklist, { FOAChecklistStep } from '../components/jobs/FOAChecklist';
import { JobData } from '../types/jobData';

interface JobDetailScreenProps {
  job: JobData;
}

export default function JobDetailScreen({ job }: JobDetailScreenProps) {
  const [showChecklist, setShowChecklist] = useState(true);

  // Handler for step explanation - can integrate with FOA chat
  const handleStepExplain = (step: FOAChecklistStep) => {
    // Option 1: Simple explanation alert (default behavior)
    // Already implemented in FOAChecklist component
    
    // Option 2: Integration with FOA Chat
    // Navigate to FOA chat with pre-filled question about the step
    // Example: router.push(`/foa-chat?question=Explain step: ${step.step}`);
    
    // Option 3: Show inline explanation modal
    // Could implement a modal with detailed AI explanation
    
    console.log('Step explanation requested:', step);
    
    // For demo purposes, you could:
    // navigation.navigate('FOAChat', { 
    //   prefilledMessage: `Explain step ${step.id}: "${step.step}"` 
    // });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Job Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <MaterialIcons name="work" size={24} color="#4F46E5" />
              <Text style={styles.jobTitle}>{job.title}</Text>
            </View>
            
            <Text style={styles.jobDescription}>{job.description}</Text>
            
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color="#64748b" />
                <Text style={styles.metaText}>
                  {job.propertyRef?.name || 'Property Location'}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color="#64748b" />
                <Text style={styles.metaText}>
                  {job.estimatedDuration ? `${job.estimatedDuration} min` : 'Est. time pending'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Map Section (placeholder) */}
        <Card style={styles.mapCard}>
          <Card.Content>
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="map" size={48} color="#64748b" />
              <Text style={styles.mapText}>Property Location Map</Text>
              <Text style={styles.mapSubtext}>
                {typeof job.location === 'string' ? job.location : job.propertyRef?.address}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Checklist Toggle */}
        <View style={styles.checklistToggle}>
          <Button
            mode={showChecklist ? "contained" : "outlined"}
            onPress={() => setShowChecklist(!showChecklist)}
            style={styles.toggleButton}
          >
            <MaterialIcons 
              name={showChecklist ? "checklist-rtl" : "checklist"} 
              size={16} 
              color={showChecklist ? "white" : "#4F46E5"} 
            />
            {showChecklist ? " Hide Checklist" : " Show FOA Checklist"}
          </Button>
        </View>

        {/* FOA Checklist Integration */}
        {showChecklist && (
          <View style={styles.checklistContainer}>
            <Divider style={styles.divider} />
            <FOAChecklist 
              job={job} 
              onStepExplain={handleStepExplain}
            />
          </View>
        )}

        {/* Additional Job Sections */}
        <Card style={styles.additionalCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            {job.bookingRef && (
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>Booking Details</Text>
                <Text style={styles.bookingText}>Guest: {job.bookingRef.guestName}</Text>
                <Text style={styles.bookingText}>Check-in: {job.bookingRef.checkInDate}</Text>
                <Text style={styles.bookingText}>Check-out: {job.bookingRef.checkOutDate}</Text>
              </View>
            )}
            
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, getStatusStyle(job.status)]}>
                {job.status?.toUpperCase()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function for status styling
const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'in_progress':
      return { color: '#3b82f6' };
    case 'completed':
      return { color: '#10b981' };
    case 'accepted':
      return { color: '#f59e0b' };
    default:
      return { color: '#64748b' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  jobDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 16,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  mapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  checklistToggle: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  toggleButton: {
    borderRadius: 8,
  },
  checklistContainer: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  additionalCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  bookingInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  bookingText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

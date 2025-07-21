import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button } from 'react-native-paper';
import { usePINAuth } from '../../contexts/PINAuthContext';
import { useJobContext } from '../../contexts/JobContext';
import FOAChatBox from '../../components/ai/FOAChatBox';
import { MaterialIcons } from '@expo/vector-icons';
import { JobData } from '../../types/jobData';

export default function FOAChatScreen() {
  const { currentProfile } = usePINAuth();
  const { jobs } = useJobContext();
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);

  // Get active jobs (accepted or in progress)
  const activeJobs = jobs.filter((job: JobData) => 
    job.assignedStaffId === currentProfile?.id && 
    (job.status === 'accepted' || job.status === 'in_progress')
  );

  useEffect(() => {
    // Auto-select first active job if available
    if (activeJobs.length > 0 && !selectedJob) {
      setSelectedJob(activeJobs[0]);
    }
  }, [activeJobs.length]);

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#666" />
          <Text style={styles.errorText}>Please log in to access FOA Chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activeJobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="chat-bubble-outline" size={64} color="#666" />
          <Text style={styles.errorTitle}>No Active Jobs</Text>
          <Text style={styles.errorText}>
            Accept a job to start chatting with the FOA Assistant
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
        <Text style={styles.headerTitle}>💬 FOA Assistant</Text>
      </View>

      {/* Job Selection */}
      {activeJobs.length > 1 && (
        <View style={styles.jobSelector}>
          <Text style={styles.selectorLabel}>Select Job:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeJobs.map((job) => (
              <Button
                key={job.id}
                mode={selectedJob?.id === job.id ? 'contained' : 'outlined'}
                onPress={() => setSelectedJob(job)}
                style={styles.jobButton}
                labelStyle={styles.jobButtonLabel}
              >
                {job.title}
              </Button>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Current Job Info */}
      {selectedJob && (
        <Card style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobInfo}>
              <MaterialIcons name="work" size={20} color="#4F46E5" />
              <View style={styles.jobDetails}>
                <Text style={styles.jobTitle}>{selectedJob.title}</Text>
                <Text style={styles.jobProperty}>{selectedJob.propertyRef?.name || selectedJob.bookingRef?.propertyName || 'Unknown Property'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Chat Interface */}
      {selectedJob && (
        <FOAChatBox
          job={selectedJob}
          staffId={currentProfile.id}
          style={styles.chatContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1e293b',
  },
  jobSelector: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  jobButton: {
    marginRight: 8,
    minWidth: 120,
  },
  jobButtonLabel: {
    fontSize: 12,
  },
  jobCard: {
    margin: 16,
    marginBottom: 8,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetails: {
    marginLeft: 12,
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  jobProperty: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    margin: 16,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

/**
 * Debug component to check what jobs are available in the mobile app
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useStaffJobs } from '@/hooks/useStaffJobs';

export default function JobsDebugComponent() {
  const { currentProfile } = usePINAuth();
  const {
    jobs,
    pendingJobs,
    activeJobs,
    completedJobs,
    loading,
    error
  } = useStaffJobs({
    enableRealtime: true,
    enableCache: false // Force fresh data
  });

  useEffect(() => {
    console.log('🔍 JOBS DEBUG: Current profile:', {
      id: currentProfile?.id,
      name: currentProfile?.name,
      email: currentProfile?.email,
      role: currentProfile?.role
    });
  }, [currentProfile]);

  useEffect(() => {
    console.log('🔍 JOBS DEBUG: Jobs data:', {
      totalJobs: jobs.length,
      pendingJobs: pendingJobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      loading,
      error
    });

    if (jobs.length > 0) {
      console.log('🔍 JOBS DEBUG: All jobs details:', jobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        assignedTo: job.assignedTo,
        scheduledDate: job.scheduledDate
      })));

      console.log('🔍 JOBS DEBUG: Pending jobs details:', pendingJobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status
      })));

      console.log('🔍 JOBS DEBUG: Active jobs details:', activeJobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status
      })));
    } else if (!loading) {
      console.log('⚠️ JOBS DEBUG: No jobs found but not loading. This might be the issue!');
    }
  }, [jobs, pendingJobs, activeJobs, completedJobs, loading, error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jobs Debug Info</Text>
      <Text style={styles.text}>Profile: {currentProfile?.name || 'No profile'}</Text>
      <Text style={styles.text}>Total Jobs: {jobs.length}</Text>
      <Text style={styles.text}>Pending Jobs: {pendingJobs.length}</Text>
      <Text style={styles.text}>Active Jobs: {activeJobs.length}</Text>
      <Text style={styles.text}>Completed Jobs: {completedJobs.length}</Text>
      <Text style={styles.text}>Loading: {loading ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Error: {error || 'None'}</Text>
      {jobs.length > 0 && (
        <View>
          <Text style={styles.subtitle}>Jobs:</Text>
          {jobs.map(job => (
            <Text key={job.id} style={styles.jobText}>
              {job.title} - {job.status}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  jobText: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 2,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: typeof window !== 'undefined' ? 'web' : 'native',
      firebase: {},
      auth: {},
      firestore: {},
      testJob: {},
      errors: []
    };

    try {
      // Test Firebase connection
      info.firebase.connected = !!db;
      info.firebase.projectId = db?.app?.options?.projectId;
      
      // Test Auth
      info.auth.available = !!auth;
      info.auth.currentUser = auth?.currentUser?.email || 'none';
      
      // Test Firestore connection
      try {
        const testCollection = collection(db, 'test');
        info.firestore.canCreateCollection = true;
      } catch (error) {
        info.firestore.error = error.message;
        info.errors.push(`Firestore: ${error.message}`);
      }

      // Test job collection access
      try {
        const jobsRef = collection(db, 'jobs');
        const jobsSnapshot = await getDocs(jobsRef);
        info.firestore.jobsCount = jobsSnapshot.size;
        info.firestore.canReadJobs = true;
      } catch (error) {
        info.firestore.jobsError = error.message;
        info.errors.push(`Jobs collection: ${error.message}`);
      }

      // Test specific test job
      try {
        const testJobRef = doc(db, 'jobs', 'test_job_001');
        const testJobSnap = await getDoc(testJobRef);
        info.testJob.exists = testJobSnap.exists();
        if (testJobSnap.exists()) {
          const data = testJobSnap.data();
          info.testJob.status = data?.status;
          info.testJob.title = data?.title;
          info.testJob.assignedTo = data?.assignedStaffId;
        }
      } catch (error) {
        info.testJob.error = error.message;
        info.errors.push(`Test job: ${error.message}`);
      }

      // Test staff accounts
      try {
        const staffRef = collection(db, 'staff_accounts');
        const staffSnapshot = await getDocs(staffRef);
        info.firestore.staffCount = staffSnapshot.size;
        info.firestore.canReadStaff = true;
      } catch (error) {
        info.firestore.staffError = error.message;
        info.errors.push(`Staff accounts: ${error.message}`);
      }

    } catch (error) {
      info.errors.push(`General error: ${error.message}`);
    }

    setDebugInfo(info);
    setLoading(false);
  };

  const renderSection = (title: string, data: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {Object.entries(data).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{key}:</Text>
            <Text style={[styles.value, typeof value === 'boolean' ? 
              (value ? styles.success : styles.error) : styles.normal]}>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Running Diagnostics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Debug Information</Text>
      <Text style={styles.subtitle}>Generated: {debugInfo.timestamp}</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={runDiagnostics}>
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>

      {debugInfo.errors.length > 0 && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>❌ Errors Found:</Text>
          {debugInfo.errors.map((error: string, index: number) => (
            <Text key={index} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      )}

      {renderSection('🔥 Firebase', debugInfo.firebase)}
      {renderSection('🔐 Authentication', debugInfo.auth)}
      {renderSection('📊 Firestore', debugInfo.firestore)}
      {renderSection('🧪 Test Job', debugInfo.testJob)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSection: {
    backgroundColor: '#2d1b1b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#333',
    padding: 12,
  },
  sectionContent: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  key: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '600',
    minWidth: 120,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  normal: {
    color: '#fff',
  },
  success: {
    color: '#4ade80',
  },
  error: {
    color: '#ff6b6b',
  },
});

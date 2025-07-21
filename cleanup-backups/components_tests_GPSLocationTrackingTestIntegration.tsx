/**
 * GPS Location Tracking Test Integration
 * Complete testing interface for GPS check-in and real-time tracking system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, User, Target, TestTube2, CheckCircle, Clock, AlertTriangle, Brain } from 'lucide-react-native';
import GPSCheckInBanner from '@/components/jobs/GPSCheckInBanner';
import RealTimeJobMap from '@/components/maps/RealTimeJobMap';
import { useJobLocationTracking } from '@/hooks/useJobLocationTracking';
import { JobData } from '@/types/jobData';

// Mock job data for testing
const mockJob: JobData = {
  id: 'test-gps-job-123',
  title: 'Property Maintenance - Ocean View Villa',
  description: 'Complete maintenance check including pool, garden, and guest rooms',
  jobType: 'maintenance',
  priority: 'high',
  status: 'assigned',
  scheduledDate: new Date().toISOString(),
  scheduledStartTime: '14:00',
  estimatedDuration: 120,
  assignedStaffId: 'current-staff-id',
  userId: 'current-staff-id',
  propertyRef: {
    id: 'property-456',
    name: 'Ocean View Villa',
    address: '123 Cliff Road, Koh Phangan, Thailand',
    coordinates: {
      latitude: 9.7601,
      longitude: 100.0356,
    },
  },
  location: {
    address: '123 Cliff Road, Koh Phangan, Thailand',
    coordinates: {
      latitude: 9.7601,
      longitude: 100.0356,
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Test locations for simulation
const testLocations = [
  { name: 'At Property', coordinates: { latitude: 9.7601, longitude: 100.0356 } },
  { name: 'Nearby (15m)', coordinates: { latitude: 9.76015, longitude: 100.03565 } },
  { name: 'Far Away (200m)', coordinates: { latitude: 9.7605, longitude: 100.0365 } },
  { name: 'Very Far (1km)', coordinates: { latitude: 9.7610, longitude: 100.0400 } },
];

export default function GPSLocationTrackingTestIntegration() {
  const [testMode, setTestMode] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(0);

  const {
    isCheckingIn,
    hasCheckedIn,
    checkInData,
    isTracking,
    trackingSession,
    currentLocation,
    arrivalStatus,
    hasArrived,
    distanceToProperty,
    foaCheckInMessage,
    foaArrivalMessage,
    error,
    permissionStatus,
    checkInToJob,
    startTracking,
    stopTracking,
    simulateLocation,
    testCheckIn,
    checkPermissions,
    clearError,
    reset,
  } = useJobLocationTracking({
    enableRealTimeTracking: true,
    enableArrivalDetection: true,
    enableFOAIntegration: true,
    testMode,
    updateInterval: testMode ? 5 : 60, // 5 seconds in test mode
  });

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleCheckInTest = async () => {
    try {
      addTestResult('🧪 Testing check-in process...');
      const success = await checkInToJob(mockJob);
      
      if (success) {
        addTestResult('✅ Check-in successful');
        if (foaCheckInMessage) {
          addTestResult(`🧠 FOA Message: ${foaCheckInMessage.substring(0, 50)}...`);
        }
      } else {
        addTestResult('❌ Check-in failed');
      }
    } catch (error) {
      addTestResult('❌ Check-in error occurred');
    }
  };

  const handleStartTracking = async () => {
    try {
      addTestResult('🛰️ Starting real-time tracking...');
      const success = await startTracking(mockJob);
      
      if (success) {
        addTestResult('✅ Tracking started successfully');
      } else {
        addTestResult('❌ Failed to start tracking');
      }
    } catch (error) {
      addTestResult('❌ Tracking start error');
    }
  };

  const handleStopTracking = async () => {
    try {
      addTestResult('⏹️ Stopping tracking...');
      await stopTracking();
      addTestResult('✅ Tracking stopped');
    } catch (error) {
      addTestResult('❌ Stop tracking error');
    }
  };

  const handleLocationSimulation = async () => {
    const location = testLocations[selectedLocation];
    try {
      addTestResult(`📍 Simulating location: ${location.name}`);
      await simulateLocation(location.coordinates);
      addTestResult(`✅ Location simulated at ${location.coordinates.latitude}, ${location.coordinates.longitude}`);
    } catch (error) {
      addTestResult('❌ Location simulation failed');
    }
  };

  const handleTestArrivalDetection = async () => {
    try {
      addTestResult('🎯 Testing arrival detection...');
      
      // Simulate being far away first
      await simulateLocation(testLocations[2].coordinates); // Far away
      addTestResult('📍 Simulated far location (200m away)');
      
      // Wait a moment then simulate arrival
      setTimeout(async () => {
        await simulateLocation(testLocations[1].coordinates); // Nearby (15m)
        addTestResult('📍 Simulated arrival (15m from property)');
        
        if (hasArrived) {
          addTestResult('🎯 Arrival detected!');
          if (foaArrivalMessage) {
            addTestResult(`🧠 FOA Arrival: ${foaArrivalMessage}`);
          }
        }
      }, 2000);
    } catch (error) {
      addTestResult('❌ Arrival detection test failed');
    }
  };

  const handlePermissionTest = async () => {
    try {
      addTestResult('🔒 Testing location permissions...');
      const granted = await checkPermissions();
      addTestResult(granted ? '✅ Permissions granted' : '❌ Permissions denied');
    } catch (error) {
      addTestResult('❌ Permission test failed');
    }
  };

  const handleResetSystem = () => {
    reset();
    setTestResults([]);
    addTestResult('🔄 System reset completed');
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getSystemStatus = () => {
    return {
      permissions: permissionStatus === 'granted' ? '✅' : '❌',
      checkIn: hasCheckedIn ? '✅' : '⭕',
      tracking: isTracking ? '✅' : '⭕',
      arrival: hasArrived ? '✅' : '⭕',
      distance: distanceToProperty ? `${Math.round(distanceToProperty)}m` : 'Unknown'
    };
  };

  const status = getSystemStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <MapPin size={32} color="#ffffff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>GPS Location Tracking</Text>
            <Text style={styles.subtitle}>Real-time check-in & FOA integration</Text>
          </View>
          <View style={styles.testBadge}>
            <TestTube2 size={20} color="#ffffff" />
          </View>
        </LinearGradient>

        {/* System Status */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Permissions</Text>
              <Text style={styles.statusValue}>{status.permissions}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Check-In</Text>
              <Text style={styles.statusValue}>{status.checkIn}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Tracking</Text>
              <Text style={styles.statusValue}>{status.tracking}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Arrival</Text>
              <Text style={styles.statusValue}>{status.arrival}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Distance</Text>
              <Text style={styles.statusValue}>{status.distance}</Text>
            </View>
          </View>
          
          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text style={styles.clearError}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Test Mode Toggle */}
        <View style={styles.configCard}>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Test Mode</Text>
            <Switch
              value={testMode}
              onValueChange={setTestMode}
              trackColor={{ false: '#767577', true: '#6366f1' }}
              thumbColor={testMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Show Map</Text>
            <Switch
              value={showMap}
              onValueChange={setShowMap}
              trackColor={{ false: '#767577', true: '#6366f1' }}
              thumbColor={showMap ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* GPS Check-In Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS Check-In Component</Text>
          <GPSCheckInBanner
            job={mockJob}
            testMode={testMode}
            onCheckInComplete={(success) => {
              addTestResult(success ? '✅ Banner check-in success' : '❌ Banner check-in failed');
            }}
            onStartTracking={() => {
              addTestResult('🛰️ Banner started tracking');
            }}
          />
        </View>

        {/* Map Component */}
        {showMap && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Real-Time Map</Text>
            <View style={styles.mapContainer}>
              <RealTimeJobMap
                job={mockJob}
                staffId="current-staff-id"
                autoCenter={true}
                showTrackingHistory={true}
              />
            </View>
          </View>
        )}

        {/* Location Simulation */}
        {testMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Simulation</Text>
            <View style={styles.locationGrid}>
              {testLocations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationButton,
                    selectedLocation === index && styles.selectedLocation
                  ]}
                  onPress={() => setSelectedLocation(index)}
                >
                  <Text style={[
                    styles.locationText,
                    selectedLocation === index && styles.selectedLocationText
                  ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.simulateButton}
              onPress={handleLocationSimulation}
            >
              <Target size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Simulate Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.testButton, styles.primaryButton]}
              onPress={handlePermissionTest}
            >
              <CheckCircle size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Test Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.secondaryButton]}
              onPress={handleCheckInTest}
              disabled={isCheckingIn}
            >
              <MapPin size={18} color="#6366f1" />
              <Text style={[styles.buttonText, { color: '#6366f1' }]}>
                {isCheckingIn ? 'Checking In...' : 'Test Check-In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.primaryButton]}
              onPress={isTracking ? handleStopTracking : handleStartTracking}
            >
              <Navigation size={18} color="#ffffff" />
              <Text style={styles.buttonText}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.warningButton]}
              onPress={handleTestArrivalDetection}
            >
              <Target size={18} color="#f59e0b" />
              <Text style={[styles.buttonText, { color: '#f59e0b' }]}>Test Arrival</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.dangerButton]}
              onPress={handleResetSystem}
            >
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={[styles.buttonText, { color: '#ef4444' }]}>Reset System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Implemented Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>📍 GPS check-in with location verification</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🛰️ Real-time location tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🎯 Automatic arrival detection (30m radius)</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🧠 FOA AI integration for messages</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🗺️ Live map with staff/property markers</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🔔 Missed check-in escalation</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>🧪 Test mode with location simulation</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>📊 Firestore real-time persistence</Text>
            </View>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearTestResults}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testResults}>
            {testResults.length === 0 ? (
              <Text style={styles.noResults}>No test results yet</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.testResult}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  testBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
  },
  clearError: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  configCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  locationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedLocation: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedLocationText: {
    color: '#ffffff',
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonGrid: {
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  warningButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  testResults: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  noResults: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  testResult: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  clearButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});

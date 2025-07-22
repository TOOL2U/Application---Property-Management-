/**
 * Enhanced Job Acceptance Modal - Compatible with existing Job type
 * Comprehensive job acceptance workflow with GPS verification, offline capability, and progress tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Navigation,
  Wifi,
  WifiOff,
  Timer,
  CheckSquare
} from 'lucide-react-native';
import type { Job } from '@/types/job';
import { staffJobService } from '@/services/staffJobService';

const { width, height } = Dimensions.get('window');

interface EnhancedJobAcceptanceModalCompatProps {
  visible: boolean;
  job: Job | null;
  staffId: string;
  onClose: () => void;
  onJobAccepted: (job: Job) => void;
  enableGPSVerification?: boolean;
  enableOfflineMode?: boolean;
  enableProgressTracking?: boolean;
  enableRequirementChecking?: boolean;
}

interface LocationVerification {
  isVerified: boolean;
  distance: number;
  accuracy: number;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface OfflineAction {
  id: string;
  type: 'accept' | 'reject';
  jobId: string;
  staffId: string;
  data: any;
  timestamp: Date;
  synced: boolean;
}

export default function EnhancedJobAcceptanceModalCompat({
  visible,
  job,
  staffId,
  onClose,
  onJobAccepted,
  enableGPSVerification = true,
  enableOfflineMode = true,
  enableProgressTracking = true,
  enableRequirementChecking = true
}: EnhancedJobAcceptanceModalCompatProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [locationVerification, setLocationVerification] = useState<LocationVerification | null>(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [requireGPSVerification, setRequireGPSVerification] = useState(false);
  const [acceptanceProgress, setAcceptanceProgress] = useState(0);
  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(new Set());
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState<Date | null>(null);
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Simple network monitoring
    const checkNetworkStatus = async () => {
      try {
        await fetch('https://www.google.com/favicon.ico', { method: 'HEAD' });
        setIsOnline(true);
        if (offlineActions.length > 0) {
          syncOfflineActions();
        }
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkNetworkStatus, 5000);
    checkNetworkStatus();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (job && enableOfflineMode) {
      loadOfflineActions();
    }
  }, [job]);

  useEffect(() => {
    if (visible && enableProgressTracking) {
      calculateAcceptanceProgress();
    }
  }, [visible, locationVerification, completedRequirements, estimatedArrivalTime]);

  if (!job) return null;

  const loadOfflineActions = async () => {
    if (!job) return; // Safety check
    
    try {
      const stored = await AsyncStorage.getItem(`offline_actions_${job.id}`);
      if (stored) {
        const actions: OfflineAction[] = JSON.parse(stored);
        setOfflineActions(actions);
        setPendingSyncCount(actions.filter(a => !a.synced).length);
      }
    } catch (error) {
      console.error('Error loading offline actions:', error);
    }
  };

  const saveOfflineAction = async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) => {
    if (!job) return; // Safety check
    
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      synced: false
    };

    const updatedActions = [...offlineActions, newAction];
    setOfflineActions(updatedActions);
    setPendingSyncCount(updatedActions.filter(a => !a.synced).length);

    try {
      await AsyncStorage.setItem(`offline_actions_${job.id}`, JSON.stringify(updatedActions));
    } catch (error) {
      console.error('Error saving offline action:', error);
    }
  };

  const syncOfflineActions = async () => {
    if (!isOnline || offlineActions.length === 0 || !job) return;

    try {
      const unsyncedActions = offlineActions.filter(a => !a.synced);
      
      for (const action of unsyncedActions) {
        try {
          switch (action.type) {
            case 'accept':
              await staffJobService.updateJobStatus(action.jobId, 'accepted', action.staffId);
              break;
            case 'reject':
              await staffJobService.updateJobStatus(action.jobId, 'rejected', action.staffId, {
                rejectionReason: action.data.rejectionReason
              });
              break;
          }
          action.synced = true;
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error);
        }
      }

      await AsyncStorage.setItem(`offline_actions_${job.id}`, JSON.stringify(offlineActions));
      setPendingSyncCount(offlineActions.filter(a => !a.synced).length);
    } catch (error) {
      console.error('Error syncing offline actions:', error);
    }
  };

  const verifyLocation = async (): Promise<boolean> => {
    if (!enableGPSVerification || !job || !job.location?.coordinates) return true;

    setIsVerifyingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location access is required for job verification.');
        setIsVerifyingLocation(false);
        return false;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        job.location.coordinates.latitude,
        job.location.coordinates.longitude
      );

      const verification: LocationVerification = {
        isVerified: distance <= 100,
        distance,
        accuracy: currentLocation.coords.accuracy || 0,
        timestamp: new Date(),
        coordinates: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        }
      };

      setLocationVerification(verification);
      setIsVerifyingLocation(false);

      if (!verification.isVerified && requireGPSVerification) {
        Alert.alert(
          'Location Verification Failed',
          `You are ${Math.round(distance)}m away from the job location. You must be within 100m to accept this job.`,
          [
            { text: 'Try Again', onPress: () => verifyLocation() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Location verification error:', error);
      setIsVerifyingLocation(false);
      Alert.alert('Location Error', 'Unable to verify location. Please try again.');
      return false;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const calculateAcceptanceProgress = () => {
    let progress = 0;

    // Location verification (25%)
    if (!enableGPSVerification || locationVerification?.isVerified) {
      progress += 25;
    }

    // Requirements completion (40%)
    if (enableRequirementChecking && job && job.requirements && job.requirements.length > 0) {
      const completionRate = completedRequirements.size / job.requirements.length;
      progress += completionRate * 40;
    } else {
      progress += 40;
    }

    // Arrival time estimation (15%)
    if (estimatedArrivalTime) {
      progress += 15;
    }

    setAcceptanceProgress(Math.min(progress, 80));
  };

  const handleRequirementToggle = (requirementId: string) => {
    const newCompleted = new Set(completedRequirements);
    if (newCompleted.has(requirementId)) {
      newCompleted.delete(requirementId);
    } else {
      newCompleted.add(requirementId);
    }
    setCompletedRequirements(newCompleted);
  };

  const estimateArrivalTime = () => {
    if (!locationVerification) {
      Alert.alert('Location Required', 'Please verify your location first.');
      return;
    }

    const estimatedMinutes = Math.max(10, Math.round(locationVerification.distance / 500));
    const arrivalTime = new Date(Date.now() + estimatedMinutes * 60000);
    setEstimatedArrivalTime(arrivalTime);
  };

  const handleAcceptJob = async () => {
    try {
      setIsLoading(true);

      // Check if job exists
      if (!job) {
        Alert.alert('Error', 'Job not found. Please refresh and try again.');
        setIsLoading(false);
        onClose();
        return;
      }

      if (enableGPSVerification && requireGPSVerification) {
        const locationValid = await verifyLocation();
        if (!locationValid) {
          setIsLoading(false);
          return;
        }
      }

      if (enableRequirementChecking && job.requirements && job.requirements.length > 0) {
        const requiredRequirements = job.requirements.filter(req => !req.isCompleted);
        const missingRequired = requiredRequirements.filter(req => !completedRequirements.has(req.id));
        
        if (missingRequired.length > 0) {
          Alert.alert(
            'Required Items Missing',
            `Please confirm understanding of:\n${missingRequired.map(req => `• ${req.description}`).join('\n')}`,
            [
              { text: 'Review', style: 'cancel' },
              { text: 'Accept Anyway', onPress: () => processAcceptance() }
            ]
          );
          setIsLoading(false);
          return;
        }
      }

      await processAcceptance();
    } catch (error) {
      console.error('Error accepting job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
      setIsLoading(false);
    }
  };

  const processAcceptance = async () => {
    // Check if job exists
    if (!job) {
      Alert.alert('Error', 'Job not found. Please refresh and try again.');
      setIsLoading(false);
      onClose();
      return;
    }

    if (!isOnline && enableOfflineMode) {
      await saveOfflineAction({
        type: 'accept',
        jobId: job.id,
        staffId: staffId,
        data: {
          locationVerification,
          estimatedArrivalTime,
          completedRequirements: Array.from(completedRequirements)
        }
      });

      Alert.alert(
        'Job Accepted Offline! 📱',
        'Your acceptance has been saved and will be synced when you reconnect to the internet.',
        [
          {
            text: 'OK',
            onPress: () => {
              setAcceptanceProgress(100);
              onJobAccepted(job);
              onClose();
            }
          }
        ]
      );
      return;
    }

    try {
      const result = await staffJobService.updateJobStatus(job.id, 'accepted', staffId);
      if (result) {
        setAcceptanceProgress(100);
        Alert.alert(
          'Job Accepted! ✅',
          `You have successfully accepted this job.${estimatedArrivalTime ? `\n\nEstimated arrival: ${estimatedArrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onJobAccepted({ ...job, status: 'accepted' });
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to accept job');
      }
    } catch (error) {
      console.error('Error in processAcceptance:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    }
    setIsLoading(false);
  };

  const handleRejectJob = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejecting this job.');
      return;
    }

    // Check if job exists
    if (!job) {
      Alert.alert('Error', 'Job not found. Please refresh and try again.');
      setIsLoading(false);
      onClose();
      return;
    }

    try {
      setIsLoading(true);

      if (!isOnline && enableOfflineMode) {
        await saveOfflineAction({
          type: 'reject',
          jobId: job.id,
          staffId: staffId,
          data: { rejectionReason: rejectionReason.trim() }
        });

        Alert.alert(
          'Job Rejected Offline',
          'Your rejection has been saved and will be synced when you reconnect.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                setRejectionReason('');
                setShowRejectionInput(false);
              }
            }
          ]
        );
        return;
      }

      const result = await staffJobService.updateJobStatus(job.id, 'rejected', staffId, {
        rejectionReason: rejectionReason.trim()
      });

      if (result) {
        Alert.alert(
          'Job Rejected',
          'You have rejected this job. The admin will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                setRejectionReason('');
                setShowRejectionInput(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to reject job');
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      Alert.alert('Error', 'Failed to reject job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Job Assignment</Text>
            <View style={styles.headerIcons}>
              {enableOfflineMode && (
                <View style={styles.networkStatus}>
                  {isOnline ? (
                    <Wifi size={20} color="#22c55e" />
                  ) : (
                    <WifiOff size={20} color="#ef4444" />
                  )}
                  {pendingSyncCount > 0 && (
                    <View style={styles.syncBadge}>
                      <Text style={styles.syncCount}>{pendingSyncCount}</Text>
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <XCircle size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Progress Bar */}
          {enableProgressTracking && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={[styles.progressFill, { width: `${acceptanceProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(acceptanceProgress)}% Complete</Text>
            </View>
          )}
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Job Title and Priority */}
          <View style={styles.titleSection}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
          </View>

          {/* Job Type */}
          <View style={styles.typeSection}>
            <Text style={styles.jobType}>{job.type.replace('_', ' ').toUpperCase()}</Text>
          </View>

          {/* GPS Verification Section */}
          {enableGPSVerification && job && job.location && job.location.coordinates && (
            <View style={styles.gpsSection}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <Navigation size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Location Verification</Text>
                  <Switch
                    value={requireGPSVerification}
                    onValueChange={setRequireGPSVerification}
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={requireGPSVerification ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
                
                {locationVerification ? (
                  <View style={styles.locationResult}>
                    <View style={[styles.locationStatus, { 
                      backgroundColor: locationVerification.isVerified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }]}>
                      <Text style={[styles.locationStatusText, {
                        color: locationVerification.isVerified ? '#22c55e' : '#ef4444'
                      }]}>
                        {locationVerification.isVerified ? '✅ Verified' : '❌ Too Far'}
                      </Text>
                      <Text style={styles.distanceText}>
                        {Math.round(locationVerification.distance)}m away
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.verifyButton} 
                    onPress={verifyLocation}
                    disabled={isVerifyingLocation}
                  >
                    {isVerifyingLocation ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify Location</Text>
                    )}
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          )}

          {/* Requirements Checklist */}
          {enableRequirementChecking && job && job.requirements && job.requirements.length > 0 && (
            <View style={styles.requirementsSection}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <CheckSquare size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Requirements Checklist</Text>
                  <Text style={styles.requirementProgress}>
                    {completedRequirements.size}/{job.requirements.length}
                  </Text>
                </View>
                
                {job.requirements.map((requirement, index) => (
                  <View key={requirement.id} style={styles.requirementItem}>
                    <TouchableOpacity
                      style={styles.requirementCheckbox}
                      onPress={() => handleRequirementToggle(requirement.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        completedRequirements.has(requirement.id) && styles.checkboxChecked
                      ]}>
                        {completedRequirements.has(requirement.id) && (
                          <CheckCircle size={16} color="#ffffff" />
                        )}
                      </View>
                      <View style={styles.requirementContent}>
                        <Text style={styles.requirementText}>
                          {index + 1}. {requirement.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Arrival Time Estimation */}
          <View style={styles.arrivalSection}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.sectionHeader}>
                <Timer size={20} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Estimated Arrival</Text>
              </View>
              
              {estimatedArrivalTime ? (
                <View style={styles.arrivalTime}>
                  <Text style={styles.arrivalTimeText}>
                    {estimatedArrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <TouchableOpacity onPress={estimateArrivalTime}>
                    <Text style={styles.updateTimeText}>Update</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.estimateButton} 
                  onPress={estimateArrivalTime}
                  disabled={!locationVerification}
                >
                  <Text style={[
                    styles.estimateButtonText,
                    !locationVerification && styles.disabledText
                  ]}>
                    Estimate Arrival Time
                  </Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>

          {/* Job Details */}
          <View style={styles.detailsCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.detailRow}>
                <Calendar size={20} color="#8b5cf6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Scheduled For</Text>
                  <Text style={styles.detailValue}>{formatDate(job.scheduledDate)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Clock size={20} color="#8b5cf6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Estimated Duration</Text>
                  <Text style={styles.detailValue}>{job.estimatedDuration} minutes</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin size={20} color="#8b5cf6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{job.location.address}</Text>
                  <Text style={styles.detailSubValue}>
                    {job.location.city}, {job.location.state} {job.location.zipCode}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Description */}
          {job.description && (
            <View style={styles.descriptionCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <FileText size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <Text style={styles.description}>{job.description}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Rejection Reason Input */}
          {showRejectionInput && (
            <View style={styles.rejectionCard}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.cardGradient}
              >
                <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
                <TextInput
                  style={styles.rejectionInput}
                  placeholder="Please explain why you cannot accept this job..."
                  placeholderTextColor="#9ca3af"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {rejectionReason.length}/500 characters
                </Text>
              </LinearGradient>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!showRejectionInput ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => setShowRejectionInput(true)}
                disabled={isLoading}
              >
                <XCircle size={20} color="#ffffff" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.acceptButton,
                  (enableProgressTracking && acceptanceProgress < 50) && styles.disabledButton
                ]}
                onPress={handleAcceptJob}
                disabled={isLoading || (enableProgressTracking && acceptanceProgress < 50)}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.acceptButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={20} color="#ffffff" />
                      <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectionInput(false);
                  setRejectionReason('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmRejectButton]}
                onPress={handleRejectJob}
                disabled={isLoading || !rejectionReason.trim()}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.rejectButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <XCircle size={20} color="#ffffff" />
                      <Text style={styles.confirmRejectButtonText}>Confirm Rejection</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkStatus: {
    position: 'relative',
  },
  syncBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  typeSection: {
    marginBottom: 20,
  },
  jobType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  gpsSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  requirementsSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  arrivalSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rejectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  requirementProgress: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  locationResult: {
    marginTop: 8,
  },
  locationStatus: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  verifyButton: {
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  requirementItem: {
    marginBottom: 12,
  },
  requirementCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  arrivalTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  arrivalTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  updateTimeText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  estimateButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  estimateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9ca3af',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 2,
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  rejectionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  confirmRejectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmRejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

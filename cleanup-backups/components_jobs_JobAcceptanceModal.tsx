/**
 * Job Acceptance Modal Component
 * Handles job acceptance/rejection workflow in mobile app
 */

import React, { useState } from 'react';
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
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  Phone
} from 'lucide-react-native';
import type { JobAssignment } from '@/types/jobAssignment';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';
import { staffJobService } from '@/services/staffJobService';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

interface JobAcceptanceModalProps {
  visible: boolean;
  job: JobAssignment | null;
  staffId: string;
  onClose: () => void;
  onJobUpdated: (job: JobAssignment) => void;
}

export default function JobAcceptanceModal({
  visible,
  job,
  staffId,
  onClose,
  onJobUpdated
}: JobAcceptanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  if (!job) return null;

  const handleAcceptJob = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 JobAcceptanceModal: Accepting job with data:', {
        jobId: job?.id,
        staffId: staffId,
        jobObject: job ? 'exists' : 'null'
      });
      
      if (!job) {
        console.error('❌ JobAcceptanceModal: Job object is null');
        Alert.alert('Error', 'Job not found. Please try again.');
        return;
      }
      
      if (!job.id) {
        console.error('❌ JobAcceptanceModal: Job ID is missing');
        Alert.alert('Error', 'Job ID is missing. Please try again.');
        return;
      }
      
      // Try staffJobService first since the debug showed the job is in 'jobs' collection
      console.log('🔄 JobAcceptanceModal: Trying staffJobService first...');
      let response = await staffJobService.updateJobStatus(
        job.id,
        'accepted',
        staffId,
        { acceptedAt: new Date() }
      );
      
      console.log('📥 JobAcceptanceModal: StaffJobService response:', {
        success: response.success,
        error: response.error
      });
      
      let updatedJob: JobAssignment | null = null;
      
      // If staffJobService fails, try jobAssignmentService as fallback
      if (!response.success) {
        console.log('🔄 JobAcceptanceModal: StaffJobService failed, trying jobAssignmentService...');
        const fallbackResponse = await jobAssignmentService.updateJobStatus({
          jobId: job.id,
          staffId: staffId,
          status: 'accepted',
          accepted: true
        });
        
        console.log('📥 JobAcceptanceModal: JobAssignmentService response:', {
          success: fallbackResponse.success,
          error: fallbackResponse.error
        });
        
        // Use fallback response if it succeeded
        if (fallbackResponse.success) {
          response = { success: true, error: undefined };
          updatedJob = fallbackResponse.job || null;
        }
      } else {
        // If staffJobService succeeded, create updated job object manually
        updatedJob = { 
          ...job, 
          status: 'accepted', 
          accepted: true, 
          acceptedAt: Timestamp.fromDate(new Date())
        };
      }

      console.log('📥 JobAcceptanceModal: Service response:', {
        success: response.success,
        hasJob: updatedJob ? 'yes' : 'no',
        error: response.error
      });

      if (response.success && updatedJob) {
        Alert.alert(
          'Job Accepted! ✅',
          'You have successfully accepted this job. It will now appear in your active jobs.',
          [
            {
              text: 'OK',
              onPress: () => {
                onJobUpdated(updatedJob!);
                onClose();
              }
            }
          ]
        );
      } else {
        console.error('❌ JobAcceptanceModal: Accept job failed:', response.error);
        Alert.alert('Error', response.error || 'Failed to accept job');
      }
    } catch (error) {
      console.error('❌ JobAcceptanceModal: Exception accepting job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectJob = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejecting this job.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Try staffJobService first since the debug showed the job is in 'jobs' collection
      console.log('🔄 JobAcceptanceModal: Rejecting job with staffJobService first...');
      let response = await staffJobService.updateJobStatus(
        job.id,
        'rejected',
        staffId,
        { rejectionReason: rejectionReason.trim(), rejectedAt: new Date() }
      );
      
      let updatedJob: JobAssignment | null = null;
      
      // If staffJobService fails, try jobAssignmentService as fallback
      if (!response.success) {
        console.log('🔄 JobAcceptanceModal: StaffJobService failed, trying jobAssignmentService...');
        const fallbackResponse = await jobAssignmentService.updateJobStatus({
          jobId: job.id,
          staffId: staffId,
          status: 'rejected',
          accepted: false,
          rejectionReason: rejectionReason.trim()
        });
        
        // Use fallback response if it succeeded
        if (fallbackResponse.success) {
          response = { success: true, error: undefined };
          updatedJob = fallbackResponse.job || null;
        }
      } else {
        // If staffJobService succeeded, create updated job object manually
        updatedJob = { 
          ...job, 
          status: 'rejected', 
          accepted: false, 
          rejectionReason: rejectionReason.trim(),
          rejectedAt: Timestamp.fromDate(new Date())
        };
      }

      if (response.success && updatedJob) {
        Alert.alert(
          'Job Rejected',
          'You have rejected this job. The admin will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                onJobUpdated(updatedJob!);
                onClose();
                setRejectionReason('');
                setShowRejectionInput(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to reject job');
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      Alert.alert('Error', 'Failed to reject job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
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

  const handleNavigateToProperty = async () => {
    if (!job?.location?.coordinates) {
      Alert.alert('Navigation Error', 'Property location coordinates not available.');
      return;
    }

    const { latitude, longitude } = job.location.coordinates;
    const label = (job as any).propertyName || job.title || 'Property Location';
    
    // Different URL schemes for iOS and Android
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

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

  const handleCallContact = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#1E2A3A' }]}>
          <Text style={styles.headerTitle}>Job Assignment</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <XCircle size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

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

          {/* Job Details */}
          <View style={styles.detailsCard}>
            <View style={styles.cardGradient}>
              <View style={styles.detailRow}>
                <Calendar size={20} color="#8b5cf6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Scheduled For</Text>
                  <Text style={styles.detailValue}>{formatDate(job.scheduledFor)}</Text>
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
                  {job.location.accessInstructions && (
                    <Text style={styles.accessInstructions}>
                      Access: {job.location.accessInstructions}
                    </Text>
                  )}
                  {job.location.accessCode && (
                    <Text style={styles.accessCode}>
                      Access Code: {job.location.accessCode}
                    </Text>
                  )}
                </View>
              </View>

              {/* Navigation Button */}
              {job.location.coordinates && (
                <TouchableOpacity 
                  style={styles.navigationButton}
                  onPress={handleNavigateToProperty}
                >
                  <Navigation size={16} color="#ffffff" />
                  <Text style={styles.navigationButtonText}>Navigate to Property</Text>
                </TouchableOpacity>
              )}

              {job.dueDate && (
                <View style={styles.detailRow}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>{formatDate(job.dueDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Property Contacts */}
          {(job as any).contacts && (job as any).contacts.length > 0 && (
            <View style={styles.contactsCard}>
              <View style={styles.cardGradient}>
                <View style={styles.sectionHeader}>
                  <Phone size={20} color="#C6FF00" />
                  <Text style={styles.sectionTitle}>Property Contacts</Text>
                </View>
                {(job as any).contacts.map((contact: any, index: number) => (
                  <View key={index} style={styles.contactItem}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactRole}>{contact.role}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.callButton}
                      onPress={() => handleCallContact(contact.phone)}
                    >
                      <Phone size={16} color="#22c55e" />
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

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

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.requirementsCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <CheckCircle size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Requirements</Text>
                </View>
                {job.requirements.map((requirement, index) => (
                  <View key={requirement.id} style={styles.requirementItem}>
                    <Text style={styles.requirementText}>
                      {index + 1}. {requirement.description}
                    </Text>
                    {requirement.isRequired && (
                      <Text style={styles.requiredLabel}>Required</Text>
                    )}
                  </View>
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Booking Details */}
          {job.bookingDetails && (
            <View style={styles.bookingCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <User size={20} color="#8b5cf6" />
                  <Text style={styles.sectionTitle}>Guest Information</Text>
                </View>
                <Text style={styles.guestName}>{job.bookingDetails.guestName}</Text>
                <Text style={styles.bookingDates}>
                  Check-in: {formatDate(job.bookingDetails.checkIn)}
                </Text>
                <Text style={styles.bookingDates}>
                  Check-out: {formatDate(job.bookingDetails.checkOut)}
                </Text>
                {job.bookingDetails.specialRequests && (
                  <Text style={styles.specialRequests}>
                    Special Requests: {job.bookingDetails.specialRequests}
                  </Text>
                )}
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
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptJob}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.acceptButtonGradient}
                >
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.acceptButtonText}>
                    {isLoading ? 'Accepting...' : 'Accept Job'}
                  </Text>
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
                  <XCircle size={20} color="#ffffff" />
                  <Text style={styles.confirmRejectButtonText}>
                    {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </Text>
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
    backgroundColor: '#0B0F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    padding: 4,
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
    fontFamily: 'Inter_700Bold',
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
    fontFamily: 'Inter_700Bold',
  },
  typeSection: {
    marginBottom: 20,
  },
  jobType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C6FF00',
    fontFamily: 'Inter_600SemiBold',
  },
  detailsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  requirementsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  rejectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardGradient: {
    padding: 16,
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
    color: '#8E9AAE',
    marginBottom: 2,
    fontFamily: 'Inter_400Regular',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter_600SemiBold',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#8E9AAE',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    fontFamily: 'Inter_700Bold',
  },
  description: {
    fontSize: 16,
    color: '#8E9AAE',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  requirementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#8E9AAE',
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
    fontFamily: 'Inter_700Bold',
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  bookingDates: {
    fontSize: 14,
    color: '#8E9AAE',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  specialRequests: {
    fontSize: 14,
    color: '#8E9AAE',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    fontFamily: 'Inter_700Bold',
  },
  rejectionInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'Inter_400Regular',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E9AAE',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_700Bold',
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
    color: '#0B0F1A',
    fontFamily: 'Inter_700Bold',
  },
  cancelButton: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
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
    fontFamily: 'Inter_700Bold',
  },
  accessInstructions: {
    fontSize: 14,
    color: '#8E9AAE',
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  accessCode: {
    fontSize: 14,
    color: '#22c55e',
    marginTop: 2,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6FF00',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  navigationButtonText: {
    color: '#0B0F1A',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  contactsCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  contactRole: {
    color: '#8E9AAE',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  callButtonText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

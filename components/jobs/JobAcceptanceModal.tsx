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
  FileText
} from 'lucide-react-native';
import type { JobAssignment } from '@/types/jobAssignment';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';

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
      
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: staffId,
        status: 'accepted',
        accepted: true
      });

      if (response.success && response.job) {
        Alert.alert(
          'Job Accepted! ✅',
          'You have successfully accepted this job. It will now appear in your active jobs.',
          [
            {
              text: 'OK',
              onPress: () => {
                onJobUpdated(response.job!);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to accept job');
      }
    } catch (error) {
      console.error('Error accepting job:', error);
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
      
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: staffId,
        status: 'rejected',
        accepted: false,
        rejectionReason: rejectionReason.trim()
      });

      if (response.success && response.job) {
        Alert.alert(
          'Job Rejected',
          'You have rejected this job. The admin will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                onJobUpdated(response.job!);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Job Assignment</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <XCircle size={24} color="#ffffff" />
          </TouchableOpacity>
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
                </View>
              </View>

              {job.dueDate && (
                <View style={styles.detailRow}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>{formatDate(job.dueDate)}</Text>
                  </View>
                </View>
              )}
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
    backgroundColor: '#1a1a2e',
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
  requirementsCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookingCard: {
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
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
    lineHeight: 20,
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bookingDates: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  specialRequests: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
    fontStyle: 'italic',
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

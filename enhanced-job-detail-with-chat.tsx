/**
 * Enhanced Job Detail Screen with Smart Checklist and Embedded FOA Chat Integration
 * Demonstrates the integration of both smart checklist and AI chat systems
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  CheckSquare,
  MessageSquare,
  Settings,
  Star,
  Brain
} from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import SmartJobChecklist from '@/components/jobs/SmartJobChecklist';
import EmbeddedJobChat from '@/components/jobs/EmbeddedJobChat';
import { jobChecklistService } from '@/services/jobChecklistService';
import { embeddedFOAChatService, ChatMessage } from '@/services/embeddedFOAChatService';

interface EnhancedJobDetailProps {
  job: JobData;
  onBack: () => void;
  onUpdateJob: (updatedJob: JobData) => void;
}

export default function EnhancedJobDetail({
  job,
  onBack,
  onUpdateJob
}: EnhancedJobDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'chat'>('details');
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Subscribe to checklist progress updates
    const checklistUnsubscribe = jobChecklistService.subscribeToChecklist(
      job.id,
      (checklist) => {
        if (checklist) {
          const completed = checklist.items.filter(item => item.completed).length;
          const total = checklist.items.length;
          setChecklistProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
        }
      }
    );

    // Subscribe to chat messages for unread count
    const chatUnsubscribe = embeddedFOAChatService.subscribeToChatMessages(
      job.id,
      (messages) => {
        // Count unread FOA messages (simplified - in real app you'd track read status)
        const foaMessages = messages.filter(msg => 
          msg.sender === 'foa' && 
          msg.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );
        setUnreadMessages(foaMessages.length);
      }
    );

    return () => {
      checklistUnsubscribe();
      chatUnsubscribe();
    };
  }, [job.id]);

  const handleTabPress = (tab: 'details' | 'checklist' | 'chat') => {
    setActiveTab(tab);
    if (tab === 'checklist') {
      setChecklistVisible(true);
    } else if (tab === 'chat') {
      setChatVisible(true);
      setUnreadMessages(0); // Mark as read
    }
  };

  const handleMessageSent = (message: string) => {
    console.log('Staff message sent:', message);
  };

  const handleFOAResponse = (message: ChatMessage) => {
    console.log('FOA response received:', message);
    // Could trigger notifications or other actions here
  };

  const renderTabButton = (
    tab: 'details' | 'checklist' | 'chat',
    icon: React.ReactNode,
    label: string,
    badge?: number
  ) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => handleTabPress(tab)}
    >
      <View style={styles.tabIcon}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.tabLabel,
        activeTab === tab && styles.activeTabLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderJobDetails = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title || job.description}</Text>
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.metaText}>{job.propertyId || 'No property assigned'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.metaText}>
              {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'No date scheduled'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <User size={16} color="#6b7280" />
            <Text style={styles.metaText}>
              {job.assignedStaffId || 'Unassigned'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.checklistButton]}
          onPress={() => setChecklistVisible(true)}
        >
          <CheckSquare size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Checklist</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{checklistProgress}%</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => setChatVisible(true)}
        >
          <Brain size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>FOA Chat</Text>
          {unreadMessages > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.settingsButton]}>
          <Settings size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Job Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {job.description || 'No description provided for this job.'}
        </Text>
      </View>

      {/* Special Instructions */}
      {job.specialInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.instructions}>{job.specialInstructions}</Text>
        </View>
      )}

      {/* Priority and Status */}
      <View style={styles.statusSection}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Priority</Text>
          <View style={[
            styles.priorityBadge,
            job.priority === 'high' && styles.highPriority,
            job.priority === 'medium' && styles.mediumPriority,
            job.priority === 'low' && styles.lowPriority,
          ]}>
            <Text style={styles.priorityText}>{job.priority}</Text>
          </View>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[
            styles.statusBadge,
            job.status === 'completed' && styles.completedStatus,
            job.status === 'in_progress' && styles.inProgressStatus,
            job.status === 'pending' && styles.pendingStatus,
          ]}>
            <Text style={styles.statusText}>{job.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity style={styles.starButton}>
          <Star size={24} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton(
          'details',
          <Calendar size={20} color={activeTab === 'details' ? '#6366f1' : '#6b7280'} />,
          'Details'
        )}
        {renderTabButton(
          'checklist',
          <CheckSquare size={20} color={activeTab === 'checklist' ? '#6366f1' : '#6b7280'} />,
          'Checklist',
          checklistProgress
        )}
        {renderTabButton(
          'chat',
          <MessageSquare size={20} color={activeTab === 'chat' ? '#6366f1' : '#6b7280'} />,
          'FOA Chat',
          unreadMessages
        )}
      </View>

      {/* Content */}
      {activeTab === 'details' && renderJobDetails()}
      
      {activeTab === 'checklist' && (
        <View style={styles.fullScreenContent}>
          <SmartJobChecklist 
            job={job}
            onProgress={(progress) => setChecklistProgress(progress)}
          />
        </View>
      )}

      {activeTab === 'chat' && (
        <View style={styles.fullScreenContent}>
          <EmbeddedJobChat
            job={job}
            onMessageSent={handleMessageSent}
            onFOAResponse={handleFOAResponse}
          />
        </View>
      )}

      {/* Checklist Modal */}
      <Modal
        visible={checklistVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChecklistVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setChecklistVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Job Checklist</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <SmartJobChecklist 
            job={job}
            onProgress={(progress) => setChecklistProgress(progress)}
          />
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setChatVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>FOA Assistant</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <EmbeddedJobChat
            job={job}
            onMessageSent={handleMessageSent}
            onFOAResponse={handleFOAResponse}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A', // Dark theme background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  starButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1F2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#0B0F1A',
    borderWidth: 1,
    borderColor: '#C6FF00',
  },
  tabIcon: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabLabel: {
    color: '#C6FF00',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
  jobHeader: {
    padding: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  jobMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  checklistButton: {
    backgroundColor: '#C6FF00',
  },
  chatButton: {
    backgroundColor: '#0091EA',
  },
  settingsButton: {
    backgroundColor: '#666666',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B0F1A',
    marginTop: 8,
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11, 15, 26, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C6FF00',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#C6FF00',
    lineHeight: 20,
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#C6FF00',
  },
  statusSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 20,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  highPriority: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  mediumPriority: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  lowPriority: {
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#C6FF00',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedStatus: {
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#C6FF00',
  },
  inProgressStatus: {
    backgroundColor: 'rgba(0, 145, 234, 0.2)',
    borderWidth: 1,
    borderColor: '#0091EA',
  },
  pendingStatus: {
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
    borderWidth: 1,
    borderColor: '#666666',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C6FF00',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalSpacer: {
    width: 60,
  },
});

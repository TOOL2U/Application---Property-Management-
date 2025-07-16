/**
 * Assign Staff View - Admin Only
 * Allows admin users to assign staff to jobs and properties
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import {
  Users,
  UserPlus,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Plus,
  X,
} from 'lucide-react-native';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  currentJobs: number;
  rating: number;
}

interface JobAssignment {
  id: string;
  title: string;
  propertyName: string;
  scheduledDate: Date;
  priority: string;
  status: string;
  assignedStaff?: StaffMember;
}

export default function AssignStaffView() {
  const { user } = useAuth();
  const { isAdminOrManager } = useStaffAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [unassignedJobs, setUnassignedJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'staff' | 'jobs'>('staff');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual data loading from Firebase
      // For now, show placeholder data
      
      const mockStaff: StaffMember[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@siamoon.com',
          role: 'cleaner',
          department: 'Housekeeping',
          isActive: true,
          currentJobs: 3,
          rating: 4.8,
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@siamoon.com',
          role: 'maintenance',
          department: 'Maintenance',
          isActive: true,
          currentJobs: 2,
          rating: 4.9,
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@siamoon.com',
          role: 'staff',
          department: 'General',
          isActive: false,
          currentJobs: 0,
          rating: 4.5,
        },
      ];

      const mockJobs: JobAssignment[] = [
        {
          id: '1',
          title: 'Pool Cleaning Service',
          propertyName: 'Ocean View Villa',
          scheduledDate: new Date('2024-01-16'),
          priority: 'high',
          status: 'unassigned',
        },
        {
          id: '2',
          title: 'HVAC Maintenance',
          propertyName: 'Downtown Loft',
          scheduledDate: new Date('2024-01-17'),
          priority: 'medium',
          status: 'unassigned',
        },
      ];

      setStaffMembers(mockStaff);
      setUnassignedJobs(mockJobs);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAssignJob = (job: JobAssignment) => {
    setSelectedJob(job);
    setShowAssignModal(true);
  };

  const assignJobToStaff = (staff: StaffMember) => {
    if (!selectedJob) return;

    Alert.alert(
      'Assign Job',
      `Assign "${selectedJob.title}" to ${staff.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            // TODO: Implement actual job assignment
            console.log('Assigning job', selectedJob.id, 'to staff', staff.id);
            Alert.alert('Success', `Job assigned to ${staff.name}`);
            setShowAssignModal(false);
            setSelectedJob(null);
          },
        },
      ]
    );
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'manager': return '#3b82f6';
      case 'cleaner': return '#22c55e';
      case 'maintenance': return '#f59e0b';
      case 'staff': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Access control check
  if (!isAdminOrManager) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.restrictedContainer}>
            <AlertTriangle size={64} color="#f59e0b" />
            <Text style={styles.restrictedTitle}>Access Restricted</Text>
            <Text style={styles.restrictedText}>
              This feature is only available to admin and manager users.
            </Text>
            <Text style={styles.restrictedSubtext}>
              Contact your administrator for access.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderStaffCard = (staff: StaffMember) => (
    <View key={staff.id} style={styles.staffCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.staffCardGradient}
      >
        <View style={styles.staffHeader}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{staff.name}</Text>
            <Text style={styles.staffEmail}>{staff.email}</Text>
          </View>
          <View style={styles.staffStatus}>
            <View style={[styles.statusDot, { backgroundColor: staff.isActive ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>{staff.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.staffDetails}>
          <View style={styles.staffDetailItem}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(staff.role) }]}>
              <Text style={styles.roleText}>{staff.role.toUpperCase()}</Text>
            </View>
            <Text style={styles.departmentText}>{staff.department}</Text>
          </View>

          <View style={styles.staffStats}>
            <View style={styles.statItem}>
              <Briefcase size={16} color="#8b5cf6" />
              <Text style={styles.statText}>{staff.currentJobs} jobs</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle size={16} color="#22c55e" />
              <Text style={styles.statText}>{staff.rating}/5.0</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderJobCard = (job: JobAssignment) => (
    <View key={job.id} style={styles.jobCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.jobLocation}>
              <MapPin size={14} color="#9ca3af" />
              <Text style={styles.propertyName}>{job.propertyName}</Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
            <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobSchedule}>
            <Calendar size={16} color="#8b5cf6" />
            <Text style={styles.scheduleText}>
              {job.scheduledDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignJob(job)}
          >
            <UserPlus size={16} color="#ffffff" />
            <Text style={styles.assignButtonText}>Assign Staff</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assign Staff</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Search size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Plus size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'staff' && styles.tabActive]}
            onPress={() => setSelectedTab('staff')}
          >
            <Users size={20} color={selectedTab === 'staff' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.tabText, selectedTab === 'staff' && styles.tabTextActive]}>
              Staff ({staffMembers.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'jobs' && styles.tabActive]}
            onPress={() => setSelectedTab('jobs')}
          >
            <Briefcase size={20} color={selectedTab === 'jobs' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.tabText, selectedTab === 'jobs' && styles.tabTextActive]}>
              Unassigned Jobs ({unassignedJobs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : selectedTab === 'staff' ? (
            staffMembers.map(renderStaffCard)
          ) : (
            unassignedJobs.map(renderJobCard)
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Staff</Text>
                <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                  <X size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {selectedJob && (
                <View style={styles.selectedJobInfo}>
                  <Text style={styles.selectedJobTitle}>{selectedJob.title}</Text>
                  <Text style={styles.selectedJobProperty}>{selectedJob.propertyName}</Text>
                </View>
              )}

              <ScrollView style={styles.staffList}>
                {staffMembers
                  .filter(staff => staff.isActive)
                  .map(staff => (
                    <TouchableOpacity
                      key={staff.id}
                      style={styles.staffOption}
                      onPress={() => assignJobToStaff(staff)}
                    >
                      <View style={styles.staffOptionInfo}>
                        <Text style={styles.staffOptionName}>{staff.name}</Text>
                        <Text style={styles.staffOptionRole}>{staff.role} • {staff.currentJobs} jobs</Text>
                      </View>
                      <Text style={styles.staffOptionRating}>{staff.rating}/5.0</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  staffCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  staffCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  staffStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  staffDetails: {
    gap: 12,
  },
  staffDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  departmentText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  staffStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  jobCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  restrictedText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  restrictedSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectedJobInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
  },
  selectedJobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  selectedJobProperty: {
    fontSize: 14,
    color: '#9ca3af',
  },
  staffList: {
    maxHeight: 300,
  },
  staffOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  staffOptionInfo: {
    flex: 1,
  },
  staffOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  staffOptionRole: {
    fontSize: 14,
    color: '#9ca3af',
  },
  staffOptionRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
  },
});

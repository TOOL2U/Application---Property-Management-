import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { jobService } from '@/services/jobService';
import { Job } from '@/types/job';
import EnhancedStaffDashboard from '@/components/dashboard/EnhancedStaffDashboard';
import { Card } from '@/components/ui/Card';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { useSync } from '@/hooks/useSync';
import { webhookService } from '@/services/webhookService';
import {
  collection,
  query,
  where,
  // Fix: Keep required imports for test functions
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
// Fix: Remove unused authService import
// import { authService } from '@/services/authService';
import UserTestScreen from '@/components/UserTestScreen';
import {
  Home,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Bell,
  Settings,
} from 'lucide-react-native';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedTasks: number;
  pendingTasks: number;
  propertiesManaged: number;
  maintenanceIssues: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'task' | 'maintenance' | 'sync';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const { hasRole } = useStaffAuth();
  const { isOnline, isSyncing, lastSyncTime, pendingOperations, conflictCount } = useSync();

  const [refreshing, setRefreshing] = useState(false);
  const [showUserTest, setShowUserTest] = useState(false);

  // Staff Dashboard State
  // Note: These are used in loadStaffDashboardData function
  const [todaysJobs, setTodaysJobs] = useState<Job[]>([]);
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 24,
    activeBookings: 8,
    completedTasks: 156,
    pendingTasks: 12,
    propertiesManaged: 15,
    maintenanceIssues: 3,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'booking',
      title: 'New Booking Confirmed',
      description: 'Villa Sunset - John Smith, Check-in: Tomorrow',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'success',
    },
    {
      id: '2',
      type: 'task',
      title: 'Cleaning Task Completed',
      description: 'Villa Paradise - Deep cleaning finished',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'success',
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'Maintenance Required',
      description: 'Villa Ocean View - AC unit needs attention',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'warning',
    },
    {
      id: '4',
      type: 'sync',
      title: 'Data Sync Completed',
      description: 'All data synchronized with web application',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'info',
    },
  ]);

  useEffect(() => {
    if (isStaffUser && user?.id) {
      loadStaffDashboardData();
      // Set up real-time listener for test job
      setupTestJobListener();
    } else {
      loadDashboardData();
    }
  }, [isStaffUser, user?.id]);

  const loadDashboardData = async () => {
    try {
      // In a real app, this would fetch data from your sync service
      // For now, we'll simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update stats based on sync status
      setStats(prevStats => ({
        ...prevStats,
        // Add some dynamic updates based on sync status
        pendingTasks: pendingOperations,
        maintenanceIssues: conflictCount,
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isStaffUser && user?.id) {
      await loadStaffDashboardData();
    } else {
      await loadDashboardData();
    }
    setRefreshing(false);
  };

  const loadStaffDashboardData = async () => {
    if (!user?.id) return;

    try {
      setJobsLoading(true);

      // Load today's jobs for staff users
      const todaysResponse = await jobService.getTodaysJobs(user.id);
      if (todaysResponse.success) {
        const pending = todaysResponse.jobs.filter(job =>
          job.status === 'assigned' || job.status === 'pending'
        );
        const accepted = todaysResponse.jobs.filter(job =>
          job.status === 'accepted' || job.status === 'in_progress'
        );

        setPendingJobs(pending);
        setTodaysJobs(accepted);
      }
    } catch (error) {
      console.error('Error loading staff dashboard data:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  // 🧪 TEST: Real-time listener for test job from web app
  const setupTestJobListener = () => {
    if (!user?.id) return;

    console.log('🔔 Setting up test job listener for staff:', user.id);
    console.log('🎯 Listening for test job: test_job_001');
    console.log('👤 Target staff ID: iJxnTcy4xWZIoDVNnl5AgYSVPku2');

    // Listen for jobs assigned to the specific test staff ID
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('assignedStaffId', '==', 'iJxnTcy4xWZIoDVNnl5AgYSVPku2'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Firebase snapshot received:', snapshot.size, 'pending jobs');

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const jobData = change.doc.data();
          const jobId = change.doc.id;

          console.log('🆕 NEW TEST JOB DETECTED!');
          console.log('📋 Job ID:', jobId);
          console.log('📋 Job Data:', jobData);

          // Show toast notification
          Alert.alert(
            '🎯 TEST JOB RECEIVED!',
            `Job: ${jobData.title || 'Untitled'}\nLocation: ${jobData.location || 'Unknown'}\nFrom: Web App`,
            [{ text: 'OK' }]
          );

          // Add to pending jobs for display
          const newJob: Job = {
            id: jobId,
            title: jobData.title || 'Test Job from Web App',
            description: jobData.description || 'Test job assignment from web application',
            type: jobData.type || 'general',
            status: 'pending',
            priority: jobData.priority || 'medium',
            assignedTo: jobData.assignedStaffId,
            assignedBy: jobData.assignedBy || 'web-app-admin',
            assignedAt: jobData.assignedAt?.toDate() || new Date(),
            scheduledDate: jobData.scheduledDate?.toDate() || new Date(),
            estimatedDuration: jobData.estimatedDuration || 60,
            propertyId: jobData.propertyId || 'test-property-001',
            location: {
              address: jobData.location?.address || '123 Test Street',
              city: jobData.location?.city || 'Miami',
              state: jobData.location?.state || 'FL',
              zipCode: jobData.location?.zipCode || '33101',
              specialInstructions: jobData.location?.specialInstructions || 'Test job from web app'
            },
            contacts: jobData.contacts || [{
              name: 'Test Contact',
              phone: '+1 (555) 123-4567',
              email: 'test@example.com',
              role: 'property_manager',
              preferredContactMethod: 'phone'
            }],
            requirements: jobData.requirements || [],
            photos: jobData.photos || [],
            createdAt: jobData.createdAt?.toDate() || new Date(),
            updatedAt: jobData.updatedAt?.toDate() || new Date(),
            createdBy: jobData.createdBy || 'web-app-admin',
            notificationsEnabled: jobData.notificationsEnabled ?? true,
            reminderSent: jobData.reminderSent ?? false,
          };

          setPendingJobs(prev => [newJob, ...prev]);
        }
      });
    }, (error) => {
      console.error('❌ Error in test job listener:', error);
    });

    // Store unsubscribe function for cleanup
    return unsubscribe;
  };

  // 🧪 TEST: Accept job function for test jobs
  const acceptTestJob = async (jobId: string) => {
    try {
      console.log('✅ Accepting test job:', jobId);

      // Update job status in Firebase
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Job accepted successfully in Firebase');

      // Show success message
      Alert.alert(
        '✅ Job Accepted!',
        'The test job has been accepted and moved to Active Jobs.',
        [{ text: 'OK' }]
      );

      // Remove from pending jobs
      setPendingJobs(prev => prev.filter(job => job.id !== jobId));

      // Reload staff dashboard to refresh data
      loadStaffDashboardData();

    } catch (error) {
      console.error('❌ Error accepting test job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    }
  };

  // 🧪 TEST: Decline job function for test jobs
  const declineTestJob = async (jobId: string) => {
    try {
      console.log('❌ Declining test job:', jobId);

      // Update job status in Firebase
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: 'Declined from mobile app test',
        updatedAt: serverTimestamp()
      });

      console.log('❌ Job declined successfully in Firebase');

      // Show success message
      Alert.alert(
        '❌ Job Declined',
        'The test job has been declined.',
        [{ text: 'OK' }]
      );

      // Remove from pending jobs
      setPendingJobs(prev => prev.filter(job => job.id !== jobId));

    } catch (error) {
      console.error('❌ Error declining test job:', error);
      Alert.alert('Error', 'Failed to decline job. Please try again.');
    }
  };

  const handleAcceptJob = async (job: Job) => {
    if (!user?.id) return;

    Alert.alert(
      'Accept Job',
      `Are you sure you want to accept "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              const response = await jobService.acceptJob({
                jobId: job.id,
                staffId: user.id,
                acceptedAt: new Date(),
              });

              if (response.success) {
                Alert.alert('Success', 'Job accepted successfully!');
                await loadStaffDashboardData();
              } else {
                Alert.alert('Error', response.error || 'Failed to accept job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to accept job');
            }
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActivityIcon = (type: RecentActivity['type'], status: RecentActivity['status']) => {
    const size = 16;
    const getColor = () => {
      switch (status) {
        case 'success': return NeumorphicTheme.colors.semantic.success;
        case 'warning': return NeumorphicTheme.colors.semantic.warning;
        case 'error': return NeumorphicTheme.colors.semantic.error;
        default: return NeumorphicTheme.colors.semantic.info;
      }
    };

    switch (type) {
      case 'booking': return <Calendar size={size} color={getColor()} />;
      case 'task': return <CheckCircle size={size} color={getColor()} />;
      case 'maintenance': return <AlertTriangle size={size} color={getColor()} />;
      case 'sync': return <TrendingUp size={size} color={getColor()} />;
      default: return <Bell size={size} color={getColor()} />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string;
    trend?: number;
  }) => (
    <Card style={[styles.statCard, { width: (screenWidth - 60) / 2 }] as any}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        {trend !== undefined && (
          <View style={[styles.trendIndicator, { 
            backgroundColor: trend >= 0 ? `${NeumorphicTheme.colors.semantic.success}20` : `${NeumorphicTheme.colors.semantic.error}20` 
          }]}>
            <TrendingUp 
              size={12} 
              color={trend >= 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error}
              style={{ transform: [{ rotate: trend >= 0 ? '0deg' : '180deg' }] }}
            />
            <Text style={[styles.trendText, { 
              color: trend >= 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error 
            }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  );

  // Test webapp connection
  const testWebappConnection = async () => {
    try {
      Alert.alert(
        'Testing Webapp Connection',
        'Testing connection to webapp endpoints...',
        [{ text: 'OK' }]
      );

      // Test basic connection
      const connectionTest = await webhookService.testConnection();
      
      // Test fetch bookings
      const bookingsTest = await webhookService.fetchApprovedBookings();
      
      // Test sync
      const syncTest = await webhookService.syncWithWebApp({
        staffId: user?.id || 'test-staff',
        deviceId: 'test-device',
      });

      const results = [
        `Connection Test: ${connectionTest.success ? '✅ Success' : '❌ Failed'}`,
        connectionTest.error ? `Error: ${connectionTest.error}` : '',
        '',
        `Fetch Bookings: ${bookingsTest.success ? '✅ Success' : '❌ Failed'}`,
        bookingsTest.error ? `Error: ${bookingsTest.error}` : '',
        bookingsTest.success && bookingsTest.data ? `Found ${bookingsTest.data.length} bookings` : '',
        '',
        `Sync Test: ${syncTest.success ? '✅ Success' : '❌ Failed'}`,
        syncTest.error ? `Error: ${syncTest.error}` : '',
      ].filter(line => line.length > 0);

      Alert.alert(
        'Webapp Test Results',
        results.join('\n'),
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Test Failed',
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Test user authentication
  const testUserAuth = async () => {
    try {
      Alert.alert(
        'User Authentication Test',
        'Testing user authentication and Firebase connection...',
        [{ text: 'OK' }]
      );

      // These are already imported at the top of the file
      // const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
      // const { db } = await import('@/lib/firebase');
      // const { authService } = await import('@/services/authService');

      // Test 1: Find user by ID
      const userId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';
      const userRef = doc(db, 'staff accounts', userId);
      const userDoc = await getDoc(userRef);
      
      let results = [];

      if (userDoc.exists()) {
        const userData = userDoc.data();
        results.push(`✅ User Found: ${userData.full_name || userData.firstName + ' ' + userData.lastName}`);
        results.push(`Email: ${userData.email}`);
        results.push(`Role: ${userData.role}`);
        results.push(`Active: ${userData.isActive}`);
      } else {
        results.push('❌ User not found by ID');
      }

      // Test 2: Find user by email
      const staffAccountsRef = collection(db, 'staff accounts');
      const q = query(staffAccountsRef, where('email', '==', 'test@exam.com'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        results.push('✅ User found by email');
        querySnapshot.forEach(doc => {
          const data = doc.data();
          results.push(`Document ID: ${doc.id}`);
        });
      } else {
        results.push('❌ User not found by email');
      }

      // Test 3: Check if user has password field
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.password) {
          results.push('✅ User has password field');
        } else {
          results.push('❌ User missing password field');
        }
      }

      Alert.alert(
        'User Test Results',
        results.join('\n'),
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Test Failed',
        `Firebase test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Render Enhanced Staff Dashboard for staff users
  if (isStaffUser) {
    return (
      <EnhancedStaffDashboard
        user={user}
        refreshing={refreshing}
        onRefresh={onRefresh}
        pendingJobs={pendingJobs}
        onAcceptJob={acceptTestJob}
        onDeclineJob={declineTestJob}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={NeumorphicTheme.gradients.backgroundMain}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={NeumorphicTheme.colors.brand.primary}
              colors={[NeumorphicTheme.colors.brand.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.name || 'Staff Member'}
              </Text>
              <Text style={styles.userRole}>{user?.role} • {user?.department}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => {/* Navigate to profile */}}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SM'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sync Status */}
          <SyncStatusIndicator showDetails={true} />

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Active Bookings"
                value={stats.activeBookings}
                icon={<Home size={20} color={NeumorphicTheme.colors.brand.primary} />}
                color={NeumorphicTheme.colors.brand.primary}
                trend={12}
              />
              <StatCard
                title="Pending Tasks"
                value={stats.pendingTasks}
                icon={<Clock size={20} color={NeumorphicTheme.colors.semantic.warning} />}
                color={NeumorphicTheme.colors.semantic.warning}
                trend={-5}
              />
              <StatCard
                title="Completed Tasks"
                value={stats.completedTasks}
                icon={<CheckCircle size={20} color={NeumorphicTheme.colors.semantic.success} />}
                color={NeumorphicTheme.colors.semantic.success}
                trend={8}
              />
              <StatCard
                title="Maintenance Issues"
                value={stats.maintenanceIssues}
                icon={<AlertTriangle size={20} color={NeumorphicTheme.colors.semantic.error} />}
                color={NeumorphicTheme.colors.semantic.error}
                trend={-15}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard}>
                <Calendar size={24} color={NeumorphicTheme.colors.brand.primary} />
                <Text style={styles.quickActionText}>View Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionCard}>
                <MapPin size={24} color={NeumorphicTheme.colors.semantic.info} />
                <Text style={styles.quickActionText}>Properties</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionCard}>
                <Users size={24} color={NeumorphicTheme.colors.semantic.success} />
                <Text style={styles.quickActionText}>Staff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={testWebappConnection}
              >
                <Settings size={24} color={NeumorphicTheme.colors.semantic.info} />
                <Text style={styles.quickActionText}>Test Webapp</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => setShowUserTest(true)}
              >
                <Users size={24} color={NeumorphicTheme.colors.semantic.warning} />
                <Text style={styles.quickActionText}>Test User Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Card style={styles.activityCard}>
              {recentActivity.map((activity, index) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      {getActivityIcon(activity.type, activity.status)}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                      <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && <View style={styles.activityDivider} />}
                </View>
              ))}
            </Card>
          </View>

          {/* System Status */}
          <Card style={styles.systemStatusCard}>
            <Text style={styles.systemStatusTitle}>System Status</Text>
            <View style={styles.systemStatusGrid}>
              <View style={styles.systemStatusItem}>
                <View style={[styles.statusDot, { 
                  backgroundColor: isOnline ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error 
                }]} />
                <Text style={styles.systemStatusText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              
              <View style={styles.systemStatusItem}>
                <View style={[styles.statusDot, { 
                  backgroundColor: isSyncing ? NeumorphicTheme.colors.semantic.warning : NeumorphicTheme.colors.semantic.success 
                }]} />
                <Text style={styles.systemStatusText}>
                  {isSyncing ? 'Syncing' : 'Synced'}
                </Text>
              </View>
              
              <View style={styles.systemStatusItem}>
                <View style={[styles.statusDot, { 
                  backgroundColor: conflictCount > 0 ? NeumorphicTheme.colors.semantic.error : NeumorphicTheme.colors.semantic.success 
                }]} />
                <Text style={styles.systemStatusText}>
                  {conflictCount > 0 ? `${conflictCount} Conflicts` : 'No Conflicts'}
                </Text>
              </View>
            </View>
            
            {lastSyncTime && (
              <Text style={styles.lastSyncText}>
                Last sync: {formatTimeAgo(lastSyncTime)}
              </Text>
            )}
          </Card>

          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={signOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      
      {/* User Test Modal */}
      <Modal
        visible={showUserTest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserTest(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Authentication Test</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowUserTest(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <UserTestScreen />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: NeumorphicTheme.spacing[4],
    paddingBottom: NeumorphicTheme.spacing[8],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: NeumorphicTheme.spacing[6],
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  userName: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  userRole: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
  },
  profileButton: {
    marginLeft: NeumorphicTheme.spacing[4],
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NeumorphicTheme.colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...NeumorphicTheme.shadows.neumorphic.small,
  },
  profileInitials: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: '#ffffff',
  },

  // Stats Section
  statsSection: {
    marginBottom: NeumorphicTheme.spacing[6],
  },
  sectionTitle: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: NeumorphicTheme.spacing[3],
  },
  statCard: {
    padding: NeumorphicTheme.spacing[4],
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: NeumorphicTheme.spacing[3],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
    gap: NeumorphicTheme.spacing[1],
  },
  trendText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
  statValue: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  statTitle: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: NeumorphicTheme.spacing[6],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: NeumorphicTheme.spacing[3],
  },
  quickActionCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: NeumorphicTheme.colors.background.secondary,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    padding: NeumorphicTheme.spacing[4],
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[2],
    ...NeumorphicTheme.shadows.neumorphic.small,
  },
  quickActionText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.text.primary,
  },

  // Activity Section
  activitySection: {
    marginBottom: NeumorphicTheme.spacing[6],
  },
  activityCard: {
    padding: NeumorphicTheme.spacing[4],
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: NeumorphicTheme.spacing[3],
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: NeumorphicTheme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: NeumorphicTheme.spacing[1],
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  activityDescription: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  activityTime: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: NeumorphicTheme.colors.background.tertiary,
    marginVertical: NeumorphicTheme.spacing[3],
  },

  // System Status
  systemStatusCard: {
    padding: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[6],
  },
  systemStatusTitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[3],
  },
  systemStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[3],
  },
  systemStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemStatusText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
  },
  lastSyncText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    textAlign: 'center',
  },

  // Sign Out
  signOutButton: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.error}20`,
    borderWidth: 1,
    borderColor: `${NeumorphicTheme.colors.semantic.error}30`,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    padding: NeumorphicTheme.spacing[4],
    alignItems: 'center',
  },
  signOutText: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.semantic.error,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: NeumorphicTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: NeumorphicTheme.colors.border.light,
  },
  modalTitle: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: NeumorphicTheme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NeumorphicTheme.colors.text.secondary,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { jobService } from '@/services/jobService';
import { Job } from '@/types/job';
import EnhancedStaffDashboard from '@/components/dashboard/EnhancedStaffDashboard';
import { BlurHeader } from '@/components/ui/BlurHeader';
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
  LogOut,
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

export default function IndexScreen() {
  const { user, signOut } = useAuth();
  const { hasRole } = useStaffAuth();
  const { isOnline, isSyncing, lastSyncTime, pendingOperations, conflictCount } = useSync();

  const [refreshing, setRefreshing] = useState(false);
  const [showUserTest, setShowUserTest] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Staff Dashboard State
  // Note: These are used in loadStaffDashboardData function
  const [todaysJobs, setTodaysJobs] = useState<Job[]>([]);
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
  
  // Combined loading state for sign out
  const isLoading = localLoading;
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

  const handleSignOut = () => {
    console.log('🔴 Sign out button clicked in Dashboard');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign back in with either a staff or admin account.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting sign out process from dashboard...');
              setLocalLoading(true);
              
              // Check auth state before sign out
              console.log('🔍 Pre-signout auth state:', { 
                isAuthenticated: user !== null, 
                userEmail: user?.email,
                isLoading: localLoading 
              });
              
              // Perform sign out
              console.log('🔄 Calling signOut() function...');
              await signOut();
              
              // Check auth state after sign out
              console.log('🔍 Post-signout auth state:', { 
                isAuthenticated: user !== null, 
                userEmail: user?.email,
                isLoading: localLoading 
              });
              
              console.log('✅ Sign out completed successfully');
              
              // Don't manually navigate - let the tab layout handle it
              // This prevents race conditions and ensures proper auth flow
              console.log('🔄 Waiting for automatic redirect to login...');
              
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert(
                'Sign Out Error',
                'There was an error signing out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLocalLoading(false);
            }
          }
        },
      ]
    );
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
    trend,
    index = 0
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
    index?: number;
  }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      delay={200 + (index * 100)}
      className="shadow-lg"
      style={{ width: (screenWidth - 60) / 2 }}
    >
      <View className="bg-dark-surface rounded-lg p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </View>
          {trend !== undefined && (
            <View
              className="flex-row items-center px-2 py-1 rounded-sm gap-1"
              style={{
                backgroundColor: trend >= 0 ? `${NeumorphicTheme.colors.semantic.success}20` : `${NeumorphicTheme.colors.semantic.error}20`
              }}
            >
              <TrendingUp
                size={12}
                color={trend >= 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error}
                style={{ transform: [{ rotate: trend >= 0 ? '0deg' : '180deg' }] }}
              />
              <Text
                className="text-xs font-medium"
                style={{
                  color: trend >= 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error
                }}
              >
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text className="text-2xl font-bold text-white mb-1">{value}</Text>
        <Text className="text-sm text-gray-400">{title}</Text>
      </View>
    </Animatable.View>
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
    <View className="flex-1 bg-dark-bg">
      {/* Background Gradient */}
      <LinearGradient
        colors={NeumorphicTheme.gradients.background}
        className="absolute inset-0"
      />

      {/* Enhanced BlurHeader */}
      <BlurHeader
        title={`${getGreeting()}, ${user?.name || 'Admin'}!`}
        subtitle={`${user?.role} • Dashboard Overview`}
        intensity={70}
        tint="light"
        showNotificationButton={true}
        showSettingsButton={true}
        onNotificationPress={() => Alert.alert('Notifications', 'Opening notifications...')}
        onSettingsPress={() => Alert.alert('Settings', 'Opening settings...')}
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
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

          {/* Sync Status */}
          <SyncStatusIndicator showDetails={true} />

          {/* Quick Stats */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-4">Today's Overview</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                title="Active Bookings"
                value={stats.activeBookings}
                icon={<Home size={20} color={NeumorphicTheme.colors.brand.primary} />}
                color={NeumorphicTheme.colors.brand.primary}
                trend={12}
                index={0}
              />
              <StatCard
                title="Pending Tasks"
                value={stats.pendingTasks}
                icon={<Clock size={20} color={NeumorphicTheme.colors.semantic.warning} />}
                color={NeumorphicTheme.colors.semantic.warning}
                trend={-5}
                index={1}
              />
              <StatCard
                title="Completed Tasks"
                value={stats.completedTasks}
                icon={<CheckCircle size={20} color={NeumorphicTheme.colors.semantic.success} />}
                color={NeumorphicTheme.colors.semantic.success}
                trend={8}
                index={2}
              />
              <StatCard
                title="Maintenance Issues"
                value={stats.maintenanceIssues}
                icon={<AlertTriangle size={20} color={NeumorphicTheme.colors.semantic.error} />}
                color={NeumorphicTheme.colors.semantic.error}
                trend={-15}
                index={3}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity className="bg-dark-surface rounded-lg p-4 items-center gap-2 shadow-lg" style={{ width: (screenWidth - 60) / 2 }}>
                <Calendar size={24} color={NeumorphicTheme.colors.brand.primary} />
                <Text className="text-sm font-medium text-white">View Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-dark-surface rounded-lg p-4 items-center gap-2 shadow-lg" style={{ width: (screenWidth - 60) / 2 }}>
                <MapPin size={24} color={NeumorphicTheme.colors.semantic.info} />
                <Text className="text-sm font-medium text-white">Properties</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-dark-surface rounded-lg p-4 items-center gap-2 shadow-lg" style={{ width: (screenWidth - 60) / 2 }}>
                <Users size={24} color={NeumorphicTheme.colors.semantic.success} />
                <Text className="text-sm font-medium text-white">Staff</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-dark-surface rounded-lg p-4 items-center gap-2 shadow-lg"
                style={{ width: (screenWidth - 60) / 2 }}
                onPress={testWebappConnection}
              >
                <Settings size={24} color={NeumorphicTheme.colors.semantic.info} />
                <Text className="text-sm font-medium text-white">Test Webapp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-dark-surface rounded-lg p-4 items-center gap-2 shadow-lg"
                style={{ width: (screenWidth - 60) / 2 }}
                onPress={() => setShowUserTest(true)}
              >
                <Users size={24} color={NeumorphicTheme.colors.semantic.warning} />
                <Text className="text-sm font-medium text-white">Test User Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-4">Recent Activity</Text>
            <View className="bg-dark-surface rounded-lg p-4 shadow-lg">
              {recentActivity.map((activity, index) => (
                <View key={activity.id}>
                  <View className="flex-row items-start gap-3">
                    <View className="w-8 h-8 rounded-full bg-dark-card items-center justify-center mt-1">
                      {getActivityIcon(activity.type, activity.status)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-white mb-1">{activity.title}</Text>
                      <Text className="text-sm text-gray-400 mb-1">{activity.description}</Text>
                      <Text className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && <View className="h-px bg-dark-card my-3" />}
                </View>
              ))}
            </View>
          </View>

          {/* System Status */}
          <View className="bg-dark-surface rounded-lg p-4 shadow-lg mb-6">
            <Text className="text-base font-semibold text-white mb-3">System Status</Text>
            <View className="flex-row flex-wrap gap-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isOnline ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error
                  }}
                />
                <Text className="text-sm text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isSyncing ? NeumorphicTheme.colors.semantic.warning : NeumorphicTheme.colors.semantic.success
                  }}
                />
                <Text className="text-sm text-gray-400">
                  {isSyncing ? 'Syncing' : 'Synced'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: conflictCount > 0 ? NeumorphicTheme.colors.semantic.error : NeumorphicTheme.colors.semantic.success
                  }}
                />
                <Text className="text-sm text-gray-400">
                  {conflictCount > 0 ? `${conflictCount} Conflicts` : 'No Conflicts'}
                </Text>
              </View>
            </View>

            {lastSyncTime && (
              <Text className="text-xs text-gray-500 text-center">
                Last sync: {formatTimeAgo(lastSyncTime)}
              </Text>
            )}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 items-center"
            onPress={signOut}
          >
            <Text className="text-base font-medium text-red-400">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* User Test Modal */}
        <Modal
          visible={showUserTest}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowUserTest(false)}
        >
          <View className="flex-1 bg-dark-bg">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-700">
              <Text className="text-lg font-semibold text-white">User Authentication Test</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-dark-surface justify-center items-center"
                onPress={() => setShowUserTest(false)}
              >
                <Text className="text-lg font-bold text-gray-400">✕</Text>
              </TouchableOpacity>
            </View>
            <UserTestScreen />
          </View>
        </Modal>
      </View>
    );
}
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useDesignTokens } from '@/constants/Design';
import { db } from '@/lib/firebase';
import { Booking, AdminStats, COLLECTIONS } from '@/types/admin';
import { AdminService } from '@/services/adminService';
import TaskAssignmentModal from '@/components/admin/TaskAssignmentModal';

export default function AdminDashboardScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bookings' | 'staff'>('overview');
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedBookingForTask, setSelectedBookingForTask] = useState<Booking | null>(null);

  const { adminUser, signOut } = useAdminAuth();
  const router = useRouter();
  const { Colors, Typography, Spacing, BorderRadius, Shadows, colors } = useDesignTokens();

  useEffect(() => {
    if (!adminUser) {
      router.replace('/admin/login');
      return;
    }

    // Set up real-time listener for bookings
    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          ...data,
          checkIn: data.checkIn?.toDate() || new Date(),
          checkOut: data.checkOut?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
        } as Booking);
      });

      setBookings(bookingsData);
      calculateStats(bookingsData);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [adminUser]);

  const calculateStats = (bookingsData: Booking[]) => {
    const stats: AdminStats = {
      totalBookings: bookingsData.length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      approvedBookings: bookingsData.filter(b => b.status === 'approved').length,
      rejectedBookings: bookingsData.filter(b => b.status === 'rejected').length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      activeStaff: 0, // Will be calculated from staff collection
      pendingTasks: 0, // Will be calculated from tasks collection
      completedTasks: 0, // Will be calculated from tasks collection
      averageRating: 4.8, // Placeholder
    };
    setStats(stats);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear your admin session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Signing out admin user...');
              await signOut();

              // Navigate to login screen
              router.replace('/admin/login');

              // Show success message
              setTimeout(() => {
                Alert.alert('Success', 'You have been signed out successfully');
              }, 500);
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date(),
        [`${action}dBy`]: adminUser?.uid,
        [`${action}dAt`]: new Date(),
      };

      if (action === 'reject' && reason) {
        updateData.rejectionReason = reason;
      }

      await updateDoc(bookingRef, updateData);

      Alert.alert(
        'Success',
        `Booking ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const approveBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    Alert.alert(
      'Approve Booking',
      'Would you like to assign tasks to staff after approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just Approve',
          style: 'default',
          onPress: () => handleBookingAction(bookingId, 'approve'),
        },
        {
          text: 'Approve & Assign Tasks',
          style: 'default',
          onPress: async () => {
            await handleBookingAction(bookingId, 'approve');
            setSelectedBookingForTask(booking);
            setTaskModalVisible(true);
          },
        },
      ]
    );
  };

  const rejectBooking = (bookingId: string) => {
    Alert.prompt(
      'Reject Booking',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (reason) => handleBookingAction(bookingId, 'reject', reason),
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleTaskAssignment = async (taskData: any) => {
    if (!adminUser) return;

    try {
      await AdminService.assignTaskToStaff(
        taskData.bookingId,
        taskData.staffIds,
        adminUser.uid,
        {
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          estimatedDuration: taskData.estimatedDuration,
          notes: taskData.notes,
        }
      );

      Alert.alert('Success', 'Task assigned to staff successfully');
      setTaskModalVisible(false);
      setSelectedBookingForTask(null);
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error; // Let the modal handle the error
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onPress }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
      <BlurView intensity={20} style={styles.statCardBlur}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.statCardContent}
        >
          <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <Icon size={24} color={color} />
          </View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return colors.warning;
        case 'approved': return colors.success;
        case 'rejected': return colors.error;
        default: return colors.text.secondary;
      }
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return (
      <View style={styles.bookingCard}>
        <BlurView intensity={20} style={styles.bookingCardBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.bookingCardContent}
          >
            <View style={styles.bookingHeader}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingGuestName}>{booking.guestName}</Text>
                <Text style={styles.bookingProperty}>{booking.propertyName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <Calendar size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Users size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>{booking.guests} guests</Text>
              </View>
              <View style={styles.detailRow}>
                <DollarSign size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>${booking.totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {booking.status === 'pending' && (
              <View style={styles.bookingActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => rejectBooking(booking.id)}
                >
                  <XCircle size={16} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => approveBooking(booking.id)}
                >
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={[styles.actionButtonText, { color: colors.success }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
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
      padding: Spacing.mobile.screenPadding,
      paddingBottom: Spacing[4],
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      ...Typography.sizes['2xl'],
      ...Typography.styles.heading,
      color: colors.text.primary,
    },
    headerSubtitle: {
      ...Typography.sizes.sm,
      color: colors.text.secondary,
      marginTop: Spacing[1],
    },
    headerActions: {
      flexDirection: 'row',
      gap: Spacing[3],
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: Spacing.mobile.screenPadding,
      marginBottom: Spacing[4],
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: BorderRadius.lg,
      padding: Spacing[1],
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing[3],
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
    },
    activeTabText: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: Spacing.mobile.screenPadding,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing[3],
      marginBottom: Spacing[6],
    },
    statCard: {
      width: '48%',
      height: 120,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    statCardBlur: {
      flex: 1,
    },
    statCardContent: {
      flex: 1,
      padding: Spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing[2],
    },
    statValue: {
      ...Typography.sizes['2xl'],
      color: colors.text.primary,
      fontWeight: '700',
    },
    statTitle: {
      ...Typography.sizes.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: Spacing[1],
    },
    sectionTitle: {
      ...Typography.sizes.xl,
      ...Typography.styles.heading,
      color: colors.text.primary,
      marginBottom: Spacing[4],
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing[8],
    },
    emptyStateText: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    bookingCard: {
      marginBottom: Spacing[4],
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    bookingCardBlur: {
      flex: 1,
    },
    bookingCardContent: {
      padding: Spacing[4],
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing[3],
    },
    bookingInfo: {
      flex: 1,
    },
    bookingGuestName: {
      ...Typography.sizes.lg,
      fontWeight: '600',
      color: colors.text.primary,
    },
    bookingProperty: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
      marginTop: Spacing[1],
    },
    statusBadge: {
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[1],
      borderRadius: BorderRadius.sm,
    },
    statusText: {
      ...Typography.sizes.sm,
      fontWeight: '600',
    },
    bookingDetails: {
      gap: Spacing[2],
      marginBottom: Spacing[4],
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[2],
    },
    detailText: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
    },
    bookingActions: {
      flexDirection: 'row',
      gap: Spacing[3],
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing[3],
      borderRadius: BorderRadius.md,
      gap: Spacing[2],
    },
    rejectButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    approveButton: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    actionButtonText: {
      ...Typography.sizes.base,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.emptyStateText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#111111', '#1a1a1a']}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {adminUser?.displayName || adminUser?.email}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleSignOut}>
              <LogOut size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'bookings', label: 'Bookings' },
            { key: 'staff', label: 'Staff' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.content}>
            {selectedTab === 'overview' && stats && (
              <>
                <View style={styles.statsGrid}>
                  <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon={Calendar}
                    color={colors.primary}
                    onPress={() => setSelectedTab('bookings')}
                  />
                  <StatCard
                    title="Pending"
                    value={stats.pendingBookings}
                    icon={Clock}
                    color={colors.warning}
                    onPress={() => setSelectedTab('bookings')}
                  />
                  <StatCard
                    title="Approved"
                    value={stats.approvedBookings}
                    icon={CheckCircle}
                    color={colors.success}
                  />
                  <StatCard
                    title="Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color={colors.info || colors.primary}
                  />
                </View>
              </>
            )}

            {selectedTab === 'bookings' && (
              <View>
                <Text style={styles.sectionTitle}>Recent Bookings</Text>
                {bookings.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No bookings found</Text>
                  </View>
                ) : (
                  bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </View>
            )}

            {selectedTab === 'staff' && (
              <View>
                <Text style={styles.sectionTitle}>Staff Management</Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Staff management component will be added next...
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <TaskAssignmentModal
        visible={taskModalVisible}
        booking={selectedBookingForTask}
        onClose={() => {
          setTaskModalVisible(false);
          setSelectedBookingForTask(null);
        }}
        onAssign={handleTaskAssignment}
      />
    </View>
  );
}

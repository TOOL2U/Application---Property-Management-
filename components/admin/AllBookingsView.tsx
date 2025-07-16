/**
 * All Bookings View - Admin Only
 * Shows all property bookings for admin users
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Building,
  Search,
  Filter,
  Plus,
} from 'lucide-react-native';

interface Booking {
  id: string;
  propertyName: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount: number;
  guestCount: number;
}

export default function AllBookingsView() {
  const { user } = useAuth();
  const { isAdminOrManager } = useStaffAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual booking data loading from Firebase
      // For now, show placeholder data
      const mockBookings: Booking[] = [
        {
          id: '1',
          propertyName: 'Ocean View Villa',
          guestName: 'John Smith',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-20'),
          status: 'confirmed',
          totalAmount: 1250,
          guestCount: 4,
        },
        {
          id: '2',
          propertyName: 'Downtown Loft',
          guestName: 'Sarah Johnson',
          checkIn: new Date('2024-01-18'),
          checkOut: new Date('2024-01-22'),
          status: 'pending',
          totalAmount: 890,
          guestCount: 2,
        },
      ];
      
      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'checked_in': return '#3b82f6';
      case 'checked_out': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
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

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.bookingCardGradient}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingTitleSection}>
            <Building size={20} color="#8b5cf6" />
            <Text style={styles.propertyName}>{booking.propertyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.guestSection}>
          <User size={16} color="#9ca3af" />
          <Text style={styles.guestName}>{booking.guestName}</Text>
          <Text style={styles.guestCount}>({booking.guestCount} guests)</Text>
        </View>

        <View style={styles.datesSection}>
          <View style={styles.dateItem}>
            <Calendar size={16} color="#22c55e" />
            <Text style={styles.dateLabel}>Check-in:</Text>
            <Text style={styles.dateValue}>{formatDate(booking.checkIn)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Calendar size={16} color="#ef4444" />
            <Text style={styles.dateLabel}>Check-out:</Text>
            <Text style={styles.dateValue}>{formatDate(booking.checkOut)}</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <DollarSign size={16} color="#8b5cf6" />
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>{formatCurrency(booking.totalAmount)}</Text>
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
          <Text style={styles.headerTitle}>All Bookings</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Search size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Plus size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'pending', 'confirmed', 'active'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookings List */}
        <ScrollView
          style={styles.bookingsList}
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
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
          ) : bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
              <Text style={styles.emptyStateText}>
                No bookings match the current filter.
              </Text>
            </View>
          ) : (
            bookings.map(renderBookingCard)
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterTabActive: {
    backgroundColor: '#8b5cf6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookingCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  guestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  guestCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  datesSection: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

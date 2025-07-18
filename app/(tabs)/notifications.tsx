import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  type: string;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  title,
  message,
  timestamp,
  priority,
  read,
  type,
  onMarkAsRead,
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return '#FF4444';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'job_assigned': return 'briefcase';
      case 'job_updated': return 'refresh-circle';
      case 'job_completed': return 'checkmark-circle';
      case 'schedule_update': return 'calendar';
      case 'priority_change': return 'flag';
      case 'message': return 'chatbubble';
      case 'reminder': return 'alarm';
      case 'welcome': return 'hand-left';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, read ? styles.readItem : styles.unreadItem]}
      onPress={() => !read && onMarkAsRead(id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getTypeIcon() as any} 
            size={20} 
            color={getPriorityColor()} 
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.notificationTitle, read ? styles.readText : styles.unreadText]}>
            {title}
          </Text>
          <View style={styles.metaContainer}>
            <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
              {priority.toUpperCase()}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(timestamp)}
            </Text>
          </View>
        </View>
        {!read && <View style={styles.unreadDot} />}
      </View>
      <Text style={[styles.notificationMessage, read ? styles.readText : styles.unreadText]}>
        {message}
      </Text>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteAllNotifications, refreshNotifications } = useAppNotifications();
  const { currentProfile } = usePINAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    refreshNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refreshNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Delete All Notifications',
      `Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications();
              console.log('✅ All notifications deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {currentProfile?.name} • {unreadCount} unread
        </Text>
        
        <View style={styles.actionButtonsContainer}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={16} color="#0B0F1A" />
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={handleDeleteAllNotifications}
            >
              <Ionicons name="trash" size={16} color="#FF4444" />
              <Text style={styles.deleteAllText}>Delete All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C6FF00"
            colors={['#C6FF00']}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyMessage}>
              You'll receive notifications here when there are job assignments, updates, or important announcements.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                title={notification.title}
                message={notification.message}
                timestamp={notification.timestamp}
                priority={notification.priority || 'medium'}
                read={notification.read}
                type={notification.type}
                onMarkAsRead={markAsRead}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A3A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E9AAE',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#C6FF00',
    borderRadius: 8,
  },
  markAllText: {
    color: '#0B0F1A',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteAllText: {
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8E9AAE',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    fontFamily: 'Inter_700Bold',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E9AAE',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A3A',
  },
  unreadItem: {
    backgroundColor: '#0F1419',
  },
  readItem: {
    backgroundColor: 'transparent',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  unreadText: {
    color: '#FFFFFF',
  },
  readText: {
    color: '#8E9AAE',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: 'Inter_700Bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C6FF00',
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
    fontFamily: 'Inter_400Regular',
  },
});

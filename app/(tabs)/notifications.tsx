import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { showNotificationClickFeedback } from '@/utils/notificationClickHelpers';
import { useRouter } from 'expo-router';

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  type: string;
  onMarkAsRead: (id: string) => void;
  onPress: (id: string, title: string, message: string, type: string, timestamp: Date, jobId?: string) => void;
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
  onPress,
}) => {
  const { t } = useTranslation();
  
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

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { minutes });
    if (hours < 24) return t('notifications.hoursAgo', { hours });
    if (days < 7) return t('notifications.daysAgo', { days });
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    // Mark as read and show click feedback
    if (!read) {
      onMarkAsRead(id);
    }
    
    // Extract jobId from message or type if it's a job notification
    const jobId = type.startsWith('job_') ? id : undefined;
    
    // Trigger the click feedback
    onPress(id, title, message, type, timestamp, jobId);
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, read ? styles.readItem : styles.unreadItem]}
      onPress={handlePress}
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
              {t(`notifications.priority.${priority}`)}
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
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // DEBUG: Log notification data to see what's being received
  console.log('🔔 NotificationsScreen: Current state:', {
    notificationCount: notifications.length,
    unreadCount,
    isLoading,
    currentProfile: currentProfile?.id,
    notifications: notifications.map(n => ({
      id: n.id,
      title: n.title,
      read: n.read,
      type: n.type,
      timestamp: n.timestamp
    }))
  });

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

  const handleNotificationPress = (id: string, title: string, message: string, type: string, timestamp: Date, jobId?: string) => {
    console.log('🔔 NotificationScreen: Notification clicked', { id, title, type, jobId });
    
    // Show immediate feedback popup
    showNotificationClickFeedback(
      {
        id,
        title,
        message,
        type,
        jobId,
        timestamp,
      },
      (jobId) => {
        console.log('🔔 NotificationScreen: Navigate to job:', jobId);
        router.push(`/jobs/${jobId}`);
      }
    );
  };

  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) return;

    Alert.alert(
      t('notifications.deleteAll'),
      t('notifications.deleteAllConfirm', { count: notifications.length }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('notifications.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications();
              console.log('✅ All notifications deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete notifications:', error);
              Alert.alert(t('common.error'), t('notifications.deleteError'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {currentProfile?.name} • {t('notifications.unreadCount', { count: unreadCount })}
        </Text>
        
        <View style={styles.actionButtonsContainer}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={16} color="#0B0F1A" />
              <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
            </TouchableOpacity>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={handleDeleteAllNotifications}
            >
              <Ionicons name="trash" size={16} color="#FF4444" />
              <Text style={styles.deleteAllText}>{t('notifications.deleteAll')}</Text>
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
            <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>{t('notifications.noNotificationsYet')}</Text>
            <Text style={styles.emptyMessage}>
              {t('notifications.noNotificationsMessage')}
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
                onPress={handleNotificationPress}
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

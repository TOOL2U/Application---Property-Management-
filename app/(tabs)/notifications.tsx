import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { showNotificationClickFeedback } from '@/utils/notificationClickHelpers';
import { useRouter } from 'expo-router';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';
import { Button } from '@/components/ui/BrandButton';

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
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return BrandTheme.colors.ERROR;
      case 'medium': return BrandTheme.colors.WARNING;
      case 'low': return BrandTheme.colors.SUCCESS;
      default: return BrandTheme.colors.YELLOW;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_assigned': return 'briefcase';
      case 'job_update': return 'refresh';
      case 'system': return 'information-circle';
      case 'message': return 'mail';
      default: return 'notifications';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !read && styles.unreadNotification
      ]}
      onPress={() => onPress(id, title, message, type, timestamp)}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(priority) + '20' }]}>
          <Ionicons
            name={getTypeIcon(type)}
            size={20}
            color={getPriorityColor(priority)}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, !read && styles.unreadTitle]}>
              {title}
            </Text>
            {!read && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {message}
          </Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>
              {formatTime(timestamp)}
            </Text>
            <Text style={[styles.priorityBadge, { color: getPriorityColor(priority) }]}>
              {priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {!read && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkAsRead(id);
            }}
          >
            <Ionicons name="checkmark" size={16} color={BrandTheme.colors.SUCCESS} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function BrandNotificationsScreen() {
  const { notifications, unreadCount, markAsRead, refreshNotifications } = useAppNotifications();
  const { currentProfile } = usePINAuth();
  const { t } = useTranslation();
  const router = useRouter();

  console.log('🔔 NotificationScreen: Rendering with', notifications.length, 'notifications');

  const handleNotificationPress = async (
    id: string, 
    title: string, 
    message: string, 
    type: string, 
    timestamp: Date, 
    jobId?: string
  ) => {
    console.log('📱 Notification clicked:', { id, title, type, jobId });

    // Mark as read
    markAsRead(id);

    // Navigate based on type
    if (type === 'job_assigned' || type === 'job_update') {
      if (jobId) {
        router.push(`/jobs/${jobId}`);
      } else {
        router.push('/(tabs)/jobs-brand');
      }
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleClearAll = () => {
    Alert.alert(
      t('notifications.clear_all_title'),
      t('notifications.clear_all_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: () => {
            // Clear all notifications - simplified implementation
            notifications.forEach(notification => markAsRead(notification.id));
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons 
          name="notifications-outline" 
          size={64} 
          color={BrandTheme.colors.GREY_SECONDARY} 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {t('notifications.no_notifications')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('notifications.no_notifications_subtitle')}
      </Text>
      <Button
        title={t('notifications.refresh')}
        variant="secondary"
        onPress={refreshNotifications}
        style={styles.refreshButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 
              ? t('notifications.unread_count', { count: unreadCount })
              : t('notifications.all_caught_up')
            }
          </Text>
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={20} color={BrandTheme.colors.ERROR} />
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refreshNotifications}
              tintColor={BrandTheme.colors.YELLOW}
              colors={[BrandTheme.colors.YELLOW]}
            />
          }
        >
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <Card key={notification.id} style={styles.notificationCard}>
                <NotificationItem
                  id={notification.id}
                  title={notification.title}
                  message={notification.message}
                  timestamp={notification.timestamp}
                  priority={notification.priority || 'medium'}
                  read={notification.read}
                  type={notification.type}
                  onMarkAsRead={handleMarkAsRead}
                  onPress={handleNotificationPress}
                />
              </Card>
            ))}
            
            {/* Bottom padding */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  headerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
  },

  clearAllButton: {
    padding: BrandTheme.spacing.SM,
    marginTop: BrandTheme.spacing.XS,
  },

  scrollView: {
    flex: 1,
  },

  notificationsList: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingTop: BrandTheme.spacing.MD,
  },

  notificationCard: {
    marginBottom: BrandTheme.spacing.MD,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  notificationItem: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
  },

  unreadNotification: {
    backgroundColor: BrandTheme.colors.YELLOW + '08',
  },

  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BrandTheme.spacing.MD,
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.XS,
  },

  notificationTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_PRIMARY,
    flex: 1,
  },

  unreadTitle: {
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontWeight: 'bold',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandTheme.colors.YELLOW,
    marginLeft: BrandTheme.spacing.XS,
  },

  notificationMessage: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: BrandTheme.spacing.SM,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timestamp: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  priorityBadge: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  markReadButton: {
    padding: BrandTheme.spacing.SM,
    marginLeft: BrandTheme.spacing.SM,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: BrandTheme.spacing.XL,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.LG,
  },

  emptyTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.SM,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: BrandTheme.spacing.XL,
  },

  refreshButton: {
    marginTop: BrandTheme.spacing.MD,
  },

  bottomPadding: {
    height: BrandTheme.spacing.XL,
  },
});

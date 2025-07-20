/**
 * Notification Modal
 * Displays a dark-themed popup with notifications
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { shadowStyles } from '@/utils/shadowUtils';
import { AppNotification } from '@/services/notificationDisplayService';
import NotificationClickPopup from '@/components/notifications/NotificationClickPopup';
import { useRouter } from 'expo-router';
import { showNotificationClickFeedback } from '@/utils/notificationClickHelpers';

const NotificationItem: React.FC<{
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onPress, onMarkAsRead }) => {
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
        return 'briefcase-outline';
      case 'job_updated':
        return 'refresh-outline';
      case 'system':
        return 'settings-outline';
      case 'reminder':
        return 'alarm-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      style={{
        backgroundColor: notification.read ? '#1C1F2A' : '#252831',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: notification.read ? '#374151' : '#C6FF00',
        borderLeftWidth: 4,
        borderLeftColor: getPriorityColor(notification.priority || 'medium'),
        ...shadowStyles.small,
      }}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Icon */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: notification.read ? 'rgba(156, 163, 175, 0.1)' : 'rgba(198, 255, 0, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Ionicons 
            name={getTypeIcon(notification.type) as any}
            size={20} 
            color={notification.read ? '#9CA3AF' : '#C6FF00'} 
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{
              color: notification.read ? '#D1D5DB' : '#F1F1F1',
              fontSize: 16,
              fontWeight: '600',
              flex: 1,
            }}>
              {notification.title}
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 12,
              marginLeft: 8,
            }}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>

          <Text style={{
            color: notification.read ? '#9CA3AF' : '#D1D5DB',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 8,
          }}>
            {notification.message}
          </Text>

          {/* Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: getPriorityColor(notification.priority || 'medium'),
                fontSize: 12,
                fontWeight: '500',
                textTransform: 'uppercase',
              }}>
                {notification.priority || 'medium'}
              </Text>
              {notification.jobId && (
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 12,
                  marginLeft: 8,
                }}>
                  • Job #{notification.jobId.substring(0, 8)}
                </Text>
              )}
            </View>

            {!notification.read && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                style={{
                  backgroundColor: 'rgba(198, 255, 0, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#C6FF00',
                }}
              >
                <Text style={{
                  color: '#C6FF00',
                  fontSize: 11,
                  fontWeight: '500',
                }}>
                  Mark Read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isModalVisible,
    hideNotificationModal,
    markAsRead,
    markAllAsRead,
  } = useAppNotifications();

  const router = useRouter();
  const [clickPopupVisible, setClickPopupVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Show immediate feedback popup
    showNotificationClickFeedback(
      {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        jobId: notification.jobId,
        timestamp: notification.timestamp,
      },
      (jobId) => {
        router.push(`/jobs/${jobId}`);
        hideNotificationModal();
      }
    );
  };

  const handleViewDetails = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.jobId) {
      console.log('🔔 NotificationModal: Navigate to job:', notification.jobId);
      router.push(`/jobs/${notification.jobId}`);
      hideNotificationModal();
    }
  };

  const handleClosePopup = () => {
    setClickPopupVisible(false);
    setSelectedNotification(null);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <>
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'flex-start',
            paddingTop: 60,
          }}
          onPress={hideNotificationModal}
        >
          <Animatable.View
            animation="slideInDown"
            duration={300}
            style={{
              backgroundColor: '#0B0F1A',
              marginHorizontal: 16,
              borderRadius: 20,
              maxHeight: '80%',
              borderWidth: 1,
              borderColor: '#374151',
              ...shadowStyles.large,
            }}
          >
            <SafeAreaView edges={['top']}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#374151',
              }}>
                <View>
                  <Text style={{
                    color: '#F1F1F1',
                    fontSize: 18,
                    fontWeight: '600',
                  }}>
                    Notifications
                  </Text>
                  {unreadCount > 0 && (
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 14,
                      marginTop: 2,
                    }}>
                      {unreadCount} unread
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={handleMarkAllAsRead}
                      style={{
                        backgroundColor: 'rgba(198, 255, 0, 0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#C6FF00',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{
                        color: '#C6FF00',
                        fontSize: 12,
                        fontWeight: '500',
                      }}>
                        Mark All Read
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={hideNotificationModal}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#374151',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color="#F1F1F1" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content */}
              <View style={{ flex: 1, maxHeight: 500 }}>
                {isLoading ? (
                  <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                  }}>
                    <ActivityIndicator size="large" color="#C6FF00" />
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 16,
                      marginTop: 16,
                    }}>
                      Loading notifications...
                    </Text>
                  </View>
                ) : notifications.length === 0 ? (
                  <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                  }}>
                    <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
                    <Text style={{
                      color: '#F1F1F1',
                      fontSize: 18,
                      fontWeight: '600',
                      marginTop: 16,
                      marginBottom: 8,
                    }}>
                      No Notifications
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 14,
                      textAlign: 'center',
                    }}>
                      You're all caught up! New notifications will appear here.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={handleNotificationPress}
                        onMarkAsRead={markAsRead}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            </SafeAreaView>
          </Animatable.View>
        </Pressable>
      </Modal>

      {/* Notification Click Popup */}
      <NotificationClickPopup
        visible={clickPopupVisible}
        notification={selectedNotification}
        onClose={handleClosePopup}
        onViewDetails={handleViewDetails}
      />
    </>
  );
};

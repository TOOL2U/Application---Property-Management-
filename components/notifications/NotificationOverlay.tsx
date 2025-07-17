/**
 * Notification Overlay Component
 * Renders notification modals and banners on top of the app
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import JobAssignmentNotificationModal from './JobAssignmentNotificationModal';
import JobNotificationBanner from './JobNotificationBanner';

export default function NotificationOverlay() {
  const {
    currentJobNotification,
    showModal,
    showBanner,
    hideJobNotificationModal,
    hideJobNotificationBanner,
    acceptJob,
    declineJob,
    viewJobDetails,
  } = useNotifications();

  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      {/* Job Assignment Modal */}
      <JobAssignmentNotificationModal
        visible={showModal}
        job={currentJobNotification}
        onAccept={acceptJob}
        onDecline={declineJob}
        onDismiss={hideJobNotificationModal}
      />

      {/* Job Notification Banner */}
      <JobNotificationBanner
        visible={showBanner}
        job={currentJobNotification}
        onAccept={acceptJob}
        onViewDetails={viewJobDetails}
        onDismiss={hideJobNotificationBanner}
        autoHideDelay={8000} // 8 seconds
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

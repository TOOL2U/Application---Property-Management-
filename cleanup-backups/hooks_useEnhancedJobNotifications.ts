/**
 * Enhanced Job Notification Hook
 * Provides comprehensive job-related notification functionality
 */

import { useCallback } from 'react';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { usePushNotifications } from '@/contexts/PushNotificationContext';
import { ExpoPushNotificationSender } from '@/utils/expoPushSender';

export interface JobNotificationData {
  jobId: string;
  title: string;
  type: string;
  location: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: string;
  description?: string;
}

export const useEnhancedJobNotifications = () => {
  const { currentProfile } = usePINAuth();
  const { isInitialized } = usePushNotifications();

  const sendJobAssignmentNotification = useCallback(async (
    targetStaffId: string,
    jobData: JobNotificationData
  ): Promise<boolean> => {
    try {
      if (!currentProfile) {
        console.error('❌ No current profile for sending notification');
        return false;
      }

      if (!isInitialized) {
        console.warn('⚠️ Push notifications not initialized');
        return false;
      }

      console.log('📤 Sending job assignment notification:', jobData.jobId);

      const success = await ExpoPushNotificationSender.sendJobAssignment(targetStaffId, {
        jobId: jobData.jobId,
        title: jobData.title,
        type: jobData.type,
        location: jobData.location,
        priority: jobData.priority,
        scheduledFor: jobData.scheduledFor,
      });

      if (success) {
        console.log('✅ Job assignment notification sent successfully');
      } else {
        console.error('❌ Failed to send job assignment notification');
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending job assignment notification:', error);
      return false;
    }
  }, [currentProfile, isInitialized]);

  const sendJobStatusUpdate = useCallback(async (
    adminStaffIds: string[],
    jobData: {
      jobId: string;
      title: string;
      status: 'accepted' | 'rejected' | 'completed' | 'in_progress';
    }
  ): Promise<boolean> => {
    try {
      if (!currentProfile) {
        console.error('❌ No current profile for sending notification');
        return false;
      }

      console.log('📤 Sending job status update:', jobData.status);

      const result = await ExpoPushNotificationSender.sendJobStatusUpdate(adminStaffIds, {
        jobId: jobData.jobId,
        title: jobData.title,
        status: jobData.status,
        staffName: currentProfile.name,
      });

      const success = result.success > 0;

      if (success) {
        console.log(`✅ Job status notification sent to ${result.success} admins`);
      } else {
        console.error('❌ Failed to send job status notification');
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending job status update:', error);
      return false;
    }
  }, [currentProfile]);

  const sendEmergencyAlert = useCallback(async (
    targetStaffIds: string[],
    emergencyData: {
      title: string;
      location: string;
      description: string;
      urgency: 'high' | 'critical';
    }
  ): Promise<boolean> => {
    try {
      console.log('🚨 Sending emergency alert to', targetStaffIds.length, 'staff members');

      const result = await ExpoPushNotificationSender.sendEmergencyAlert(targetStaffIds, emergencyData);

      const success = result.success > 0;

      if (success) {
        console.log(`✅ Emergency alert sent to ${result.success} staff members`);
      } else {
        console.error('❌ Failed to send emergency alert');
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending emergency alert:', error);
      return false;
    }
  }, []);

  const sendCustomNotification = useCallback(async (
    targetStaffIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> => {
    try {
      console.log('📤 Sending custom notification to', targetStaffIds.length, 'staff members');

      const result = await ExpoPushNotificationSender.sendToMultipleStaff(
        targetStaffIds,
        title,
        body,
        data
      );

      const success = result.success > 0;

      if (success) {
        console.log(`✅ Custom notification sent to ${result.success} staff members`);
      } else {
        console.error('❌ Failed to send custom notification');
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
      return false;
    }
  }, []);

  const testBackgroundNotification = useCallback(async (): Promise<boolean> => {
    try {
      if (!currentProfile) {
        console.error('❌ No current profile for test notification');
        return false;
      }

      console.log('🧪 Testing background notification delivery...');

      const success = await ExpoPushNotificationSender.sendJobAssignment(currentProfile.id, {
        jobId: 'test-' + Date.now(),
        title: 'Test Job Assignment',
        type: 'maintenance',
        location: 'Test Location',
        priority: 'normal',
        scheduledFor: new Date().toISOString(),
      });

      if (success) {
        console.log('✅ Test notification sent - should appear even if app is closed');
      } else {
        console.error('❌ Test notification failed');
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }, [currentProfile]);

  return {
    sendJobAssignmentNotification,
    sendJobStatusUpdate,
    sendEmergencyAlert,
    sendCustomNotification,
    testBackgroundNotification,
    isNotificationReady: isInitialized,
    currentStaffId: currentProfile?.id,
  };
};

export default useEnhancedJobNotifications;

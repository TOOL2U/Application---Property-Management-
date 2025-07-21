/**
 * Smart Job Reminders Hook
 * React hook for managing FOA-powered job reminders
 */

import { useEffect, useCallback, useState } from 'react';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { smartJobReminderService } from '@/services/smartJobReminderService';
import { JobData } from '@/types/jobData';
import * as Notifications from 'expo-notifications';

interface UseSmartJobRemindersOptions {
  autoStartListener?: boolean;
  testMode?: boolean;
}

interface UseSmartJobRemindersReturn {
  isInitialized: boolean;
  error: string | null;
  scheduledReminders: any[];
  
  // Actions
  scheduleReminder: (job: JobData, testMode?: boolean) => Promise<boolean>;
  cancelJobReminders: (jobId: string) => Promise<void>;
  testReminder: (job: JobData) => Promise<boolean>;
  
  // Service state
  startListening: () => void;
  stopListening: () => void;
}

export const useSmartJobReminders = (
  options: UseSmartJobRemindersOptions = {}
): UseSmartJobRemindersReturn => {
  const { autoStartListener = true, testMode = false } = options;
  const { currentProfile } = usePINAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledReminders, setScheduledReminders] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Initialize the service
  useEffect(() => {
    const initializeService = async () => {
      try {
        const success = await smartJobReminderService.initialize();
        setIsInitialized(success);
        if (!success) {
          setError('Failed to initialize notification permissions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize reminders');
        setIsInitialized(false);
      }
    };

    initializeService();
  }, []);

  // Auto-start listener when profile is available
  useEffect(() => {
    if (autoStartListener && currentProfile?.id && isInitialized && !isListening) {
      startListening();
    }

    return () => {
      if (currentProfile?.id) {
        stopListening();
      }
    };
  }, [currentProfile?.id, isInitialized, autoStartListener]);

  // Schedule a reminder for a job
  const scheduleReminder = useCallback(async (job: JobData, isTestMode?: boolean): Promise<boolean> => {
    if (!currentProfile?.id) {
      setError('No current profile available');
      return false;
    }

    if (!isInitialized) {
      setError('Reminder service not initialized');
      return false;
    }

    try {
      const success = await smartJobReminderService.schedulePreJobReminder(
        job, 
        currentProfile.id, 
        isTestMode || testMode
      );
      
      if (success) {
        // Update scheduled reminders list
        const reminders = smartJobReminderService.getScheduledReminders(currentProfile.id);
        setScheduledReminders(reminders);
        setError(null);
      } else {
        setError('Failed to schedule reminder');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule reminder';
      setError(errorMessage);
      return false;
    }
  }, [currentProfile?.id, isInitialized, testMode]);

  // Cancel reminders for a job
  const cancelJobReminders = useCallback(async (jobId: string): Promise<void> => {
    if (!currentProfile?.id) return;

    try {
      await smartJobReminderService.cancelJobReminders(jobId);
      
      // Update scheduled reminders list
      const reminders = smartJobReminderService.getScheduledReminders(currentProfile.id);
      setScheduledReminders(reminders);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reminders';
      setError(errorMessage);
    }
  }, [currentProfile?.id]);

  // Test reminder with 2-minute delay
  const testReminder = useCallback(async (job: JobData): Promise<boolean> => {
    if (!currentProfile?.id) {
      setError('No current profile available');
      return false;
    }

    try {
      const success = await smartJobReminderService.testJobReminder(job, currentProfile.id);
      
      if (success) {
        console.log('🧪 Test reminder scheduled for 2 minutes');
        setError(null);
      } else {
        setError('Failed to schedule test reminder');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule test reminder';
      setError(errorMessage);
      return false;
    }
  }, [currentProfile?.id]);

  // Start listening for job assignments
  const startListening = useCallback(() => {
    if (!currentProfile?.id || !isInitialized || isListening) return;

    try {
      smartJobReminderService.startJobAssignmentListener(currentProfile.id);
      setIsListening(true);
      setError(null);
      console.log('✅ Started job assignment listener for reminders');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listener';
      setError(errorMessage);
    }
  }, [currentProfile?.id, isInitialized, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!currentProfile?.id || !isListening) return;

    try {
      smartJobReminderService.stopJobAssignmentListener(currentProfile.id);
      setIsListening(false);
      console.log('✅ Stopped job assignment listener for reminders');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop listener';
      setError(errorMessage);
    }
  }, [currentProfile?.id, isListening]);

  // Update scheduled reminders list when profile changes
  useEffect(() => {
    if (currentProfile?.id && isInitialized) {
      const reminders = smartJobReminderService.getScheduledReminders(currentProfile.id);
      setScheduledReminders(reminders);
    }
  }, [currentProfile?.id, isInitialized]);

  return {
    isInitialized,
    error,
    scheduledReminders,
    scheduleReminder,
    cancelJobReminders,
    testReminder,
    startListening,
    stopListening,
  };
};

// Hook for handling notification responses
export const useJobReminderNotifications = () => {
  const [lastNotificationResponse, setLastNotificationResponse] = useState<any>(null);

  useEffect(() => {
    // Listen for notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const result = await smartJobReminderService.handleNotificationResponse(response);
      
      if (result.action === 'navigate_to_job' && result.jobId) {
        setLastNotificationResponse({
          action: result.action,
          jobId: result.jobId,
          foaMessage: result.foaMessage,
          timestamp: new Date(),
        });
        
        console.log('📱 Job reminder notification tapped:', result);
      }
    });

    return () => subscription.remove();
  }, []);

  const clearLastResponse = useCallback(() => {
    setLastNotificationResponse(null);
  }, []);

  return {
    lastNotificationResponse,
    clearLastResponse,
  };
};
